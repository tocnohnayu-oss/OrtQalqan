import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, MapPinOff, Ruler } from 'lucide-react';
import type { Floor, Language, LayoutRoom, Zone } from '../domain/types';
import { openingGeometry, polygonArea, roomBounds } from '../domain/layout.mjs';
import { inspectorWords } from '../locales/inspector';
import { RoomFurniture } from './RoomFurniture';

function RoomPreview({room,floor}:{room:LayoutRoom;floor:Floor}){
  const box=roomBounds(room.points),padding=.7;
  return <svg className="room-context-preview" aria-hidden="true" viewBox={`${box.x-padding} ${box.y-padding} ${box.width+padding*2} ${box.height+padding*2}`}>
    <path d={room.points.map((point,index)=>`${index?'L':'M'}${point.x} ${point.y}`).join(' ')+'Z'} fill="#fffdf8" stroke="#42564e" strokeWidth={1.2} vectorEffect="non-scaling-stroke"/>
    <RoomFurniture room={room}/>
    {floor.layout?.openings.filter(opening=>opening.roomId===room.id).map(opening=>{const geometry=openingGeometry(room,opening);return <g key={opening.id}>
      <path d={`M${geometry.start.x} ${geometry.start.y}L${geometry.end.x} ${geometry.end.y}`} stroke="#fffdf8" strokeWidth={3} vectorEffect="non-scaling-stroke"/>
      <path d={opening.type==='door'?`M${geometry.hinge.x} ${geometry.hinge.y}L${geometry.leaf.x} ${geometry.leaf.y} ${geometry.arc}`:`M${geometry.start.x} ${geometry.start.y}L${geometry.end.x} ${geometry.end.y}`} stroke={opening.type==='door'?'#687065':'#6d8d91'} strokeWidth={.8} fill="none" vectorEffect="non-scaling-stroke"/>
    </g>;})}
  </svg>;
}

export function RoomContext({floor,zone,language,onStep,onLocate}:{floor:Floor;zone:Zone;language:Language;onStep:(id:string)=>void;onLocate:()=>void}){
  const w=inspectorWords(language),index=floor.zones.findIndex(item=>item.id===zone.id),room=floor.layout?.rooms.find(room=>room.zoneId===zone.id),marked=!!floor.plan&&floor.markers.some(marker=>marker.zoneId===zone.id);
  return <div className="zone-title room-context">
    <div className="room-context-floor">{language==='ru'?floor.name:floor.nameKk}</div>
    <div className="room-context-identity"><div><h3 data-room-heading tabIndex={-1}>{language==='ru'?zone.name:zone.nameKk}</h3>{room||marked?<button className="room-locate" onClick={onLocate}><MapPin size={13}/>{w.locate}<ArrowUpRight size={13}/></button>:<span className="room-not-placed"><MapPinOff size={13}/>{w.notPlaced}</span>}</div><div className="room-context-picture">{room?<RoomPreview room={room} floor={floor}/>:marked?<MapPin size={27} aria-hidden="true"/>:<MapPinOff size={27} aria-hidden="true"/>}</div></div>
    <nav className="room-context-nav" aria-label={w.position}><span>{w.position} <strong>{index+1}</strong> {w.of} {floor.zones.length}</span><div><button aria-label={w.previous} title={index>0?(language==='ru'?floor.zones[index-1].name:floor.zones[index-1].nameKk):w.previous} disabled={index<=0} onClick={()=>onStep(floor.zones[index-1].id)}><ArrowLeft size={17}/></button><button aria-label={w.next} title={index<floor.zones.length-1?(language==='ru'?floor.zones[index+1].name:floor.zones[index+1].nameKk):w.next} disabled={index>=floor.zones.length-1} onClick={()=>onStep(floor.zones[index+1].id)}><ArrowRight size={17}/></button></div></nav>
  </div>;
}

export function RoomAreaContext({floor,zone,language}:{floor:Floor;zone:Zone;language:Language}){
  const w=inspectorWords(language),room=floor.layout?.rooms.find(room=>room.zoneId===zone.id);
  if(!room)return null;
  const area=polygonArea(room.points),different=Math.abs(area-zone.area)>1e-8;
  return <div className={`room-area-context ${different?'is-different':''}`}><div><Ruler size={14}/><span>{w.drawingArea} <strong>{area} м²</strong></span>{different&&<span className="room-area-difference" title={w.differentArea} aria-label={w.differentArea}>≠</span>}</div>{different&&<small>{w.areaHint}</small>}</div>;
}
