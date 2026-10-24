import { Svg, Path, Text, G, Rect } from '@react-pdf/renderer';
import type { Floor, Language } from '../domain/types';
import { labelPoint, layoutBounds, openingGeometry, polygonArea } from '../domain/layout.mjs';

export function PlanPDF({floor,language}:{floor:Floor;language:Language}) {
  const layout=floor.layout!;
  const box=layoutBounds(layout),scale=Math.min(500/box.width,480/box.height),height=box.height*scale;
  return <Svg width={500} height={height} viewBox={`0 0 500 ${height}`}><Rect width={500} height={height} fill="#fffdf8"/><G transform={`translate(${-box.x*scale} ${-box.y*scale}) scale(${scale})`}>
    {layout.rooms.map(room=>{const zone=floor.zones.find(z=>z.id===room.zoneId),name=language==='ru'?zone?.name||room.name:zone?.nameKk||room.nameKk,center=labelPoint(room.points);return <G key={room.id}><Path d={room.points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+'Z'} fill={room.zoneId?'#fffdf8':'#f1eee6'} stroke="#343934" strokeWidth={.16}/><Text x={center.x} y={center.y} textAnchor="middle" fill="#343934" style={{fontFamily:'Noto',fontSize:.4}}>{name.length>27?name.slice(0,26)+'…':name}</Text><Text x={center.x} y={center.y+.55} textAnchor="middle" fill="#787a70" style={{fontFamily:'Noto',fontSize:.3}}>{polygonArea(room.points)} м²</Text></G>;})}
    {layout.openings.map(opening=>{const room=layout.rooms.find(r=>r.id===opening.roomId)!,g=openingGeometry(room,opening);return <G key={opening.id}><Path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#fffdf8" strokeWidth={.26}/>{opening.type==='door'?<Path d={`M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y} ${g.arc}`} fill="none" stroke="#687065" strokeWidth={.035}/>:<Path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#6d8d91" strokeWidth={.08}/>}</G>;})}
  </G></Svg>;
}
