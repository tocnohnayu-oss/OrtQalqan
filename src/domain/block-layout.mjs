import { edges, openingCollision, openingFits } from './layout.mjs';
import { ROOM_PRESETS } from './room-presets.mjs';
const EPS=.001;
/** Shared wall segment, described on the first room. Rooms have to touch; nearby rooms are not joined. */
export function sharedWall(room, other) {
  for(const edge of edges(room.points))for(const peer of edges(other.points)){
    const vertical=edge.a.x===edge.b.x;
    if(vertical!== (peer.a.x===peer.b.x))continue;
    if(Math.abs((vertical?edge.a.x:edge.a.y)-(vertical?peer.a.x:peer.a.y))>EPS)continue;
    const from=vertical?edge.a.y:edge.a.x,to=vertical?edge.b.y:edge.b.x,c=vertical?peer.a.y:peer.a.x,d=vertical?peer.b.y:peer.b.x;
    const low=Math.max(Math.min(from,to),Math.min(c,d)),high=Math.min(Math.max(from,to),Math.max(c,d));
    if(high-low>1.05)return {edge:edge.index,position:((low+high)/2-from)/(to-from),length:high-low};
  }
  return null;
}
/** Regenerate only template fittings. Manual edits opt the room out of this behaviour. */
export function decorateBlocks(layout) {
  const result={...layout,openings:layout.openings.filter(o=>{const r=layout.rooms.find(r=>r.id===o.roomId);return !o.auto||!r?.preset||r.autoOpenings===false;})};
  const corridors=layout.rooms.filter(r=>r.preset==='corridor');
  for(const room of layout.rooms){
    const preset=ROOM_PRESETS[room.preset];if(!preset||preset.common||room.autoOpenings===false)continue;
    const wall=edges(room.points),connected=corridors.map(c=>sharedWall(room,c)).find(Boolean);
    const bottom=[...wall].filter(e=>e.a.y===e.b.y).sort((a,b)=>b.a.y-a.a.y)[0]||wall[0];
    const door={id:`auto-${room.id}-door`,roomId:room.id,edge:connected?.edge??bottom.index,position:connected?.position??.5,width:.9,type:'door',hinge:'start',swing:'in',auto:true};
    if(!result.openings.some(o=>o.roomId===room.id&&o.type==='door')&&openingFits(room,door)&&!openingCollision(result,door))result.openings.push(door);
    if(preset.windows&&!result.openings.some(o=>o.roomId===room.id&&o.type==='window')){
      const exterior=wall.filter(e=>e.a.y===e.b.y&&!layout.rooms.some(r=>r.id!==room.id&&sharedWall(room,r)?.edge===e.index)).sort((a,b)=>a.a.y-b.a.y)[0];
      if(exterior){const window={id:`auto-${room.id}-window`,roomId:room.id,edge:exterior.index,position:.5,width:1.5,type:'window',hinge:'start',swing:'in',auto:true};if(openingFits(room,window)&&!openingCollision(result,window))result.openings.push(window);}
    }
  }
  return result;
}
