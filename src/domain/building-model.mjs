import { openingGeometry } from './layout.mjs';

const epsilon=1e-6;
/** Split collinear shared walls at real room/opening boundaries. Never duplicate a common wall. */
export function floorWalls(layout) {
  const groups=new Map();
  for(const room of layout.rooms)for(let edge=0;edge<room.points.length;edge++){
    const a=room.points[edge],b=room.points[(edge+1)%room.points.length],horizontal=Math.abs(a.y-b.y)<epsilon;
    const axis=horizontal?'x':'y',fixed=horizontal?a.y:a.x,lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]);
    const key=`${axis}:${fixed.toFixed(6)}`;
    const openings=layout.openings.filter(item=>item.roomId===room.id&&item.edge===edge).map(item=>{
      const geometry=openingGeometry(room,item);return {type:item.type,lo:Math.min(geometry.start[axis],geometry.end[axis]),hi:Math.max(geometry.start[axis],geometry.end[axis])};
    });
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push({roomId:room.id,zoneId:room.zoneId,axis,fixed,lo,hi,openings});
  }
  const walls=[];
  for(const edges of groups.values()){
    const stops=[...new Set(edges.flatMap(edge=>[edge.lo,edge.hi,...edge.openings.flatMap(opening=>[Math.max(edge.lo,opening.lo),Math.min(edge.hi,opening.hi)])]).map(value=>Math.round(value*1e6)/1e6))].sort((a,b)=>a-b);
    for(let i=0;i<stops.length-1;i++){
      const lo=stops[i],hi=stops[i+1],mid=(lo+hi)/2;if(hi-lo<epsilon)continue;
      const covering=edges.filter(edge=>mid>edge.lo-epsilon&&mid<edge.hi+epsilon);if(!covering.length)continue;
      const opening=covering.flatMap(edge=>edge.openings).filter(item=>mid>item.lo-epsilon&&mid<item.hi+epsilon).sort((a,b)=>Number(b.type==='door')-Number(a.type==='door'))[0];
      const edge=covering[0],point=value=>edge.axis==='x'?{x:value,y:edge.fixed}:{x:edge.fixed,y:value};
      walls.push({start:point(lo),end:point(hi),length:hi-lo,external:new Set(covering.map(edge=>edge.roomId)).size===1,
        opening:opening?.type||null,roomIds:[...new Set(covering.map(edge=>edge.roomId))],zoneIds:[...new Set(covering.map(edge=>edge.zoneId).filter(Boolean))]});
    }
  }
  return walls;
}

/** Height is a view assumption in metres. Geometry/areas/field records are never changed.
 * @param {import('./types').Building} building
 */
export function buildingModel(building,height=3) {
  const floorHeight=Number.isFinite(height)?Math.min(6,Math.max(2,height)):3;
  const floors=building.floors.flatMap((floor,index)=>floor.layout?.rooms.length?[{floor,index,base:index*floorHeight,height:floorHeight,walls:floorWalls(floor.layout)}]:[]);
  const points=floors.flatMap(item=>item.floor.layout.rooms.flatMap(room=>room.points));
  const bounds=points.length?points.reduce((box,point)=>({minX:Math.min(box.minX,point.x),maxX:Math.max(box.maxX,point.x),minY:Math.min(box.minY,point.y),maxY:Math.max(box.maxY,point.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}):null;
  return {floors,floorHeight,bounds,missing:building.floors.filter(floor=>!floor.layout?.rooms.length).map(floor=>floor.id),
    totalHeight:floors.length?Math.max(...floors.map(floor=>floor.base+floor.height)):0};
}
