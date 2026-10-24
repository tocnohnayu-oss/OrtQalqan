import { useId, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { FloorLayout, LayoutRoom, Language, Snapshot, Zone, Point } from '../domain/types';
import { layoutBounds, openingGeometry, polygonArea, labelPoint, labelBounds, roomBounds } from '../domain/layout.mjs';
import { planWords } from '../locales/plan';
import { RoomFurniture } from './RoomFurniture';

const pathOf=(points:Point[])=>points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+'Z';
export function PlanDrawing({layout,zones,language,selected='',onSelect,editor=false,onRoomDown,onVertexDown,onOpeningSelect,openingId='',showCounts=false,snapshot,stale=false}:{layout:FloorLayout;zones:Zone[];language:Language;selected?:string;onSelect?:(id:string)=>void;editor?:boolean;onRoomDown?:(event:React.PointerEvent,room:LayoutRoom)=>void;onVertexDown?:(event:React.PointerEvent,room:LayoutRoom,index:number)=>void;onOpeningSelect?:(id:string)=>void;openingId?:string;showCounts?:boolean;snapshot?:Snapshot;stale?:boolean}) {
  const p=planWords(language);
  return <g className="plan-geometry">
    {layout.rooms.map(room=>{const active=room.id===selected||room.zoneId===selected,zone=zones.find(z=>z.id===room.zoneId),label=language==='ru'?(zone?.name||room.name):(zone?.nameKk||room.nameKk),center=labelPoint(room.points),box=roomBounds(room.points),row=snapshot?.rows.find(r=>r.zoneId===room.zoneId);
      const labelBox=labelBounds(room.points),maxChars=Math.max(7,Math.floor((labelBox.width-.45)/.23)),short=label.length>maxChars?label.slice(0,maxChars-1)+'…':label;
      const labelWidth=Math.min(labelBox.width-.3,Math.max(1.6,short.length*.23));
      return <g data-room-id={room.id} data-preset={room.preset} data-rotation={room.rotation||0} className={`drawn-room ${active?'selected':''} ${room.zoneId?'':'common-space'}`} key={room.id} role="button" tabIndex={0} aria-label={`${label}, ${polygonArea(room.points)} ${p.sqm}`} aria-pressed={active} onClick={()=>onSelect?.(editor?room.id:room.zoneId||room.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(editor?room.id:room.zoneId||room.id);}}} onPointerDown={event=>onRoomDown?.(event,room)}>
        <path className="drawn-room-fill" d={pathOf(room.points)} fill={active?'#f6e8dd':room.zoneId?'#fffdf8':'#f1eee6'} stroke="#343934" strokeWidth=".16" strokeLinejoin="miter"/>
        <RoomFurniture room={room}/>
        <rect x={center.x-labelWidth/2} y={center.y-.6} width={labelWidth} height="1.3" rx=".05" fill={active?'#fcf1e5':'#fffdf8'} fillOpacity=".93" pointerEvents="none"/>
        <g className="drawn-room-label" pointerEvents="none"><text x={center.x} y={center.y-.1} textAnchor="middle" fill={active?'#9b472f':'#42473f'} fontSize=".46" fontFamily="Noto,Arial,sans-serif">{short}</text><text x={center.x} y={center.y+.5} textAnchor="middle" fill="#79796f" fontSize=".34" fontFamily="Noto,Arial,sans-serif">{polygonArea(room.points)} {p.sqm}{showCounts&&row?.type&&!stale?` · ${row.type==='OP'?'ОП':'ОУ'} ${row.count}`:''}</text></g>
        {editor&&active&&<g className="room-dimensions" pointerEvents="none" stroke="#a97050" strokeWidth=".025"><path d={`M${box.x} ${box.y-.6}h${box.width}M${box.x} ${box.y-.8}v.4M${box.x+box.width} ${box.y-.8}v.4M${box.x-.6} ${box.y}v${box.height}M${box.x-.8} ${box.y}h.4M${box.x-.8} ${box.y+box.height}h.4`}/><text x={box.x+box.width/2} y={box.y-.78} textAnchor="middle" fontSize=".34" stroke="none" fill="#a16c4a">{Math.round(box.width*100)/100} {p.metre}</text><text x={box.x-.8} y={box.y+box.height/2} textAnchor="middle" fontSize=".34" stroke="none" fill="#a16c4a" transform={`rotate(-90 ${box.x-.8} ${box.y+box.height/2})`}>{Math.round(box.height*100)/100} {p.metre}</text></g>}
      </g>;
    })}
    {layout.openings.map(opening=>{const room=layout.rooms.find(r=>r.id===opening.roomId);if(!room)return null;const g=openingGeometry(room,opening),selected=openingId===opening.id;return <g key={opening.id} data-room-id={opening.roomId} data-edge={opening.edge} data-auto={opening.auto} className={`plan-opening ${selected?'selected':''}`} role={editor?'button':undefined} tabIndex={editor?0:undefined} aria-label={opening.type==='door'?p.door:p.window} onClick={event=>{event.stopPropagation();onOpeningSelect?.(opening.id);}} onPointerDown={e=>{if(editor)e.stopPropagation();}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onOpeningSelect?.(opening.id);}}}>
      <path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#fffdf8" strokeWidth=".26"/>
      {opening.type==='door'?<g fill="none" stroke={selected?'#b64c32':'#687065'} strokeWidth=".035"><path d={`M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y}`}/><path d={g.arc} strokeWidth=".025"/></g>:<g stroke={selected?'#b64c32':'#6d8d91'} strokeWidth=".045"><path d={`M${g.start.x+g.normal.x*.065} ${g.start.y+g.normal.y*.065}L${g.end.x+g.normal.x*.065} ${g.end.y+g.normal.y*.065}M${g.start.x-g.normal.x*.065} ${g.start.y-g.normal.y*.065}L${g.end.x-g.normal.x*.065} ${g.end.y-g.normal.y*.065}`}/></g>}
      {editor&&<path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="transparent" strokeWidth=".65"/>}
    </g>;})}
    {editor&&layout.rooms.filter(r=>r.id===selected).map(room=><g key={room.id} className="room-handles">{room.points.map((point,index)=><circle key={index} cx={point.x} cy={point.y} r=".16" fill="#fffdf8" stroke="#b64c32" strokeWidth=".045" onPointerDown={e=>onVertexDown?.(e,room,index)}><title>{index+1}</title></circle>)}</g>)}
  </g>;
}

export function PlanGrid(){
  const id=useId().replaceAll(':','');
  return <><defs><pattern id={`${id}-small`} width=".5" height=".5" patternUnits="userSpaceOnUse"><path d="M.5 0H0V.5" stroke="#e8e5db" strokeWidth=".015" fill="none"/></pattern><pattern id={`${id}-major`} width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill={`url(#${id}-small)`}/><path d="M2 0H0V2" stroke="#dad6cb" strokeWidth=".02" fill="none"/></pattern></defs><rect x="-300" y="-300" width="600" height="600" fill={`url(#${id}-major)`} pointerEvents="none"/></>;
}

export function FloorPlanView({layout,zones,language,selected,onSelect,snapshot,stale,showCounts}:{layout:FloorLayout;zones:Zone[];language:Language;selected:string;onSelect:(id:string)=>void;snapshot:Snapshot;stale:boolean;showCounts:boolean}) {
  const initial=layoutBounds(layout),[view,setView]=useState(initial),p=planWords(language);
  const zoom=(factor:number)=>setView(v=>({x:v.x+(v.width-v.width*factor)/2,y:v.y+(v.height-v.height*factor)/2,width:Math.max(4,Math.min(480,v.width*factor)),height:Math.max(3,Math.min(480,v.height*factor))}));
  return <div className="floor-plan-view"><div className="built-plan-viewport"><svg className="built-floor-plan" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-label={p.view} role="group"><PlanGrid/><PlanDrawing layout={layout} zones={zones} language={language} selected={selected} onSelect={onSelect} snapshot={snapshot} stale={stale} showCounts={showCounts}/></svg></div><div className="plan-view-footer"><span>{layout.example?p.sampleLabel:p.notMeasured}</span><div className="plan-zoom"><button aria-label={p.zoomOut} onClick={()=>zoom(1.25)}><Minus size={16}/></button><button aria-label={p.zoomIn} onClick={()=>zoom(.8)}><Plus size={16}/></button><button aria-label={p.fit} onClick={()=>setView(layoutBounds(layout))}><Maximize2 size={16}/></button></div></div></div>;
}
