import { Svg, Path, Text, G, Rect, Circle } from '@react-pdf/renderer';
import type { Floor, Language } from '../domain/types';
import { labelPoint, labelBounds, layoutBounds, openingGeometry, polygonArea } from '../domain/layout.mjs';
import { furniturePrimitives } from '../domain/furniture.mjs';
import { placePlanLabels } from '../domain/plan-labels.mjs';

export function PlanPDF({floor,language}:{floor:Floor;language:Language}) {
  const layout=floor.layout!;
  const box=layoutBounds(layout),scale=Math.min(500/box.width,480/box.height),height=box.height*scale;
  // A 1.5x label surface keeps printed names at least 9.3pt and details at 8pt.
  const factor=1.5,items=layout.rooms.map(room=>{const zone=floor.zones.find(zone=>zone.id===room.zoneId);return {id:room.id,name:language==='kk'?zone?.nameKk||room.nameKk:zone?.name||room.name,detail:`${polygonArea(room.points)} м²`,center:labelPoint(room.points),bounds:labelBounds(room.points),priority:room.zoneId?1:0};});
  const labels=placePlanLabels(items,box,{width:500*factor,height:height*factor},(text:string,size:number)=>Array.from(text).length*size*.67);
  return <Svg width={500} height={height} viewBox={`0 0 500 ${height}`}><Rect width={500} height={height} fill="#fffdf8"/><G transform={`translate(${-box.x*scale} ${-box.y*scale}) scale(${scale})`}>
    {layout.rooms.map(room=><G key={room.id}><Path d={room.points.map((point,index)=>`${index?'L':'M'}${point.x} ${point.y}`).join(' ')+'Z'} fill={room.zoneId?'#fffdf8':'#f1eee6'} stroke="#343934" strokeWidth={.16}/>{furniturePrimitives(room).map((shape,index)=>shape.tag==='rect'?<Rect key={index} {...shape.attrs}/>:shape.tag==='circle'?<Circle key={index} {...shape.attrs}/>:<Path key={index} {...shape.attrs}/>)}</G>)}
    {layout.openings.map(opening=>{const room=layout.rooms.find(r=>r.id===opening.roomId)!,g=openingGeometry(room,opening);return <G key={opening.id}><Path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#fffdf8" strokeWidth={.26}/>{opening.type==='door'?<Path d={`M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y} ${g.arc}`} fill="none" stroke="#687065" strokeWidth={.035}/>:<Path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#6d8d91" strokeWidth={.08}/>}</G>;})}
  </G><G transform={`scale(${1/factor})`}>
    {labels.labels.map(label=>{const x=label.x+label.width/2,end={x:Math.max(label.x,Math.min(label.x+label.width,label.anchor.x)),y:Math.max(label.y,Math.min(label.y+label.height,label.anchor.y))};return <G key={label.id}>
      {label.callout&&<G><Path d={`M${label.anchor.x} ${label.anchor.y}L${end.x} ${end.y}`} stroke="#738277" strokeWidth={1}/><Circle cx={label.anchor.x} cy={label.anchor.y} r={2.2} fill="#738277"/></G>}
      <Rect x={label.x} y={label.y} width={label.width} height={label.height} fill="#fffdf8" fillOpacity={.97}/>
      {label.nameLines.map((line,index)=><Text key={`name-${index}`} x={x} y={label.y+7+label.size+index*(label.size+3)} textAnchor="middle" fill="#253b42" style={{fontFamily:'Noto',fontWeight:700,fontSize:label.size}}>{line}</Text>)}
      {label.detailLines.map((line,index)=><Text key={`detail-${index}`} x={x} y={label.y+7+label.nameLines.length*(label.size+3)+label.detailSize+index*(label.detailSize+3)} textAnchor="middle" fill="#4e625b" style={{fontFamily:'Noto',fontSize:label.detailSize}}>{line}</Text>)}
    </G>;})}
  </G></Svg>;
}
