import { useEffect, useId, useRef, useState } from 'react';
import { Focus, Maximize2, Minus, Plus } from 'lucide-react';
import type { FloorLayout, LayoutRoom, Language, Snapshot, Zone, Point } from '../domain/types';
import { layoutBounds, openingGeometry, polygonArea, labelPoint, labelBounds, roomBounds } from '../domain/layout.mjs';
import { planWords } from '../locales/plan';
import { navigateView } from '../domain/view-navigation.mjs';
import { RoomFurniture } from './RoomFurniture';
import { PlanLabels, usePlanViewport, type PlanView, type PlanViewport } from './PlanLabels';

const pathOf=(points:Point[])=>points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+'Z';
export function PlanDrawing({layout,zones,language,selected='',onSelect,editor=false,onRoomDown,onVertexDown,onOpeningSelect,openingId='',showCounts=false,snapshot,stale=false,labelView,onHiddenLabels}:{layout:FloorLayout;zones:Zone[];language:Language;selected?:string;onSelect?:(id:string)=>void;editor?:boolean;onRoomDown?:(event:React.PointerEvent,room:LayoutRoom)=>void;onVertexDown?:(event:React.PointerEvent,room:LayoutRoom,index:number)=>void;onOpeningSelect?:(id:string)=>void;openingId?:string;showCounts?:boolean;snapshot?:Snapshot;stale?:boolean;labelView?:{view:PlanView;viewport:PlanViewport};onHiddenLabels?:(hidden:number)=>void}) {
  const p=planWords(language);
  return <g className="plan-geometry">
    {layout.rooms.map(room=>{const active=room.id===selected||room.zoneId===selected,zone=zones.find(z=>z.id===room.zoneId),label=language==='ru'?(zone?.name||room.name):(zone?.nameKk||room.nameKk),center=labelPoint(room.points),box=roomBounds(room.points),row=snapshot?.rows.find(r=>r.zoneId===room.zoneId);
      const labelBox=labelBounds(room.points),maxChars=Math.max(7,Math.floor((labelBox.width-.45)/.23)),short=label.length>maxChars?label.slice(0,maxChars-1)+'…':label;
      const countLabel=showCounts&&room.zoneId&&!stale?(row?.type?`${row.type==='OP'?'ОП':'ОУ'} ${row.count}`:p.countsManual):'';
      const labelWidth=Math.min(labelBox.width-.3,Math.max(1.6,short.length*.23,countLabel?`${polygonArea(room.points)} ${p.sqm} · ${countLabel}`.length*.18:0));
      return <g data-plan-room={room.id} data-room-id={room.id} data-preset={room.preset} data-rotation={room.rotation||0} className={`drawn-room ${active?'selected':''} ${room.zoneId?'':'common-space'}`} key={room.id} role="button" tabIndex={0} aria-label={`${label}, ${polygonArea(room.points)} ${p.sqm}${countLabel?', '+countLabel:''}`} aria-pressed={active} onClick={()=>onSelect?.(editor?room.id:room.zoneId||room.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect?.(editor?room.id:room.zoneId||room.id);}}} onPointerDown={event=>onRoomDown?.(event,room)}>
        <path className="drawn-room-fill" d={pathOf(room.points)} fill={active?'#f6e8dd':room.zoneId?'#fffdf8':'#f1eee6'} stroke="#343934" strokeWidth=".16" strokeLinejoin="miter"/>
        <RoomFurniture room={room}/>
        {!labelView&&<><rect x={center.x-labelWidth/2} y={center.y-.6} width={labelWidth} height="1.3" rx=".05" fill={active?'#fcf1e5':'#fffdf8'} fillOpacity=".93" pointerEvents="none"/>
        <g className="drawn-room-label" pointerEvents="none"><text x={center.x} y={center.y-.1} textAnchor="middle" fill={active?'#9b472f':'#42473f'} fontSize=".46" fontFamily="Noto,Arial,sans-serif">{short}</text><text x={center.x} y={center.y+.5} textAnchor="middle" fill="#79796f" fontSize=".34" fontFamily="Noto,Arial,sans-serif">{polygonArea(room.points)} {p.sqm}{countLabel&&<tspan className={row?.type?'plan-count':'plan-count-manual'}>{` · ${countLabel}`}</tspan>}</text></g></>}
        {editor&&active&&<g className="room-dimensions" pointerEvents="none" stroke="#a97050" strokeWidth=".025"><path d={`M${box.x} ${box.y-.6}h${box.width}M${box.x} ${box.y-.8}v.4M${box.x+box.width} ${box.y-.8}v.4M${box.x-.6} ${box.y}v${box.height}M${box.x-.8} ${box.y}h.4M${box.x-.8} ${box.y+box.height}h.4`}/><text x={box.x+box.width/2} y={box.y-.78} textAnchor="middle" fontSize=".34" stroke="none" fill="#a16c4a">{Math.round(box.width*100)/100} {p.metre}</text><text x={box.x-.8} y={box.y+box.height/2} textAnchor="middle" fontSize=".34" stroke="none" fill="#a16c4a" transform={`rotate(-90 ${box.x-.8} ${box.y+box.height/2})`}>{Math.round(box.height*100)/100} {p.metre}</text></g>}
      </g>;
    })}
    {layout.openings.map(opening=>{const room=layout.rooms.find(r=>r.id===opening.roomId);if(!room)return null;const g=openingGeometry(room,opening),selected=openingId===opening.id;return <g key={opening.id} data-room-id={opening.roomId} data-edge={opening.edge} data-auto={opening.auto} className={`plan-opening ${selected?'selected':''}`} role={editor?'button':undefined} tabIndex={editor?0:undefined} aria-label={opening.type==='door'?p.door:p.window} onClick={event=>{event.stopPropagation();onOpeningSelect?.(opening.id);}} onPointerDown={e=>{if(editor)e.stopPropagation();}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();onOpeningSelect?.(opening.id);}}}>
      <path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#fffdf8" strokeWidth=".26"/>
      {opening.type==='door'?<g fill="none" stroke={selected?'#b64c32':'#687065'} strokeWidth=".035"><path d={`M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y}`}/><path d={g.arc} strokeWidth=".025"/></g>:<g stroke={selected?'#b64c32':'#6d8d91'} strokeWidth=".045"><path d={`M${g.start.x+g.normal.x*.065} ${g.start.y+g.normal.y*.065}L${g.end.x+g.normal.x*.065} ${g.end.y+g.normal.y*.065}M${g.start.x-g.normal.x*.065} ${g.start.y-g.normal.y*.065}L${g.end.x-g.normal.x*.065} ${g.end.y-g.normal.y*.065}`}/></g>}
      {editor&&<path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="transparent" strokeWidth=".65"/>}
    </g>;})}
    {labelView&&<PlanLabels layout={layout} zones={zones} language={language} selected={selected} view={labelView.view} viewport={labelView.viewport} showCounts={showCounts} snapshot={snapshot} stale={stale} onRoomDown={onRoomDown} onHiddenChange={onHiddenLabels}/>}
    {editor&&layout.rooms.filter(r=>r.id===selected).map(room=><g key={room.id} className="room-handles">{room.points.map((point,index)=><g key={index} onPointerDown={e=>onVertexDown?.(e,room,index)}><circle cx={point.x} cy={point.y} r=".16" fill="transparent" stroke="transparent" strokeWidth="28" vectorEffect="non-scaling-stroke" pointerEvents="all"/><circle cx={point.x} cy={point.y} r=".16" fill="#fffdf8" stroke="#b64c32" strokeWidth=".045" pointerEvents="none"/><title>{index+1}</title></g>)}</g>)}
  </g>;
}

export function PlanGrid(){
  const id=useId().replaceAll(':','');
  return <><defs><pattern id={`${id}-small`} width=".5" height=".5" patternUnits="userSpaceOnUse"><path d="M.5 0H0V.5" stroke="#e8e5db" strokeWidth=".015" fill="none"/></pattern><pattern id={`${id}-major`} width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill={`url(#${id}-small)`}/><path d="M2 0H0V2" stroke="#dad6cb" strokeWidth=".02" fill="none"/></pattern></defs><rect x="-300" y="-300" width="600" height="600" fill={`url(#${id}-major)`} pointerEvents="none"/></>;
}

type View = {x:number;y:number;width:number;height:number};
type Gesture = {view:View;rect:DOMRect;start:Point;distance:number;room:string;dragged:boolean;multi:boolean};

export function FloorPlanView({layout,zones,language,selected,onSelect,snapshot,stale,showCounts,onToggleCounts}:{layout:FloorLayout;zones:Zone[];language:Language;selected:string;onSelect:(id:string)=>void;snapshot:Snapshot;stale:boolean;showCounts:boolean;onToggleCounts:()=>void}) {
  const [view,setView]=useState(()=>layoutBounds(layout)),[dragging,setDragging]=useState(false),[hiddenLabels,setHiddenLabels]=useState(0),p=planWords(language),hintId=useId();
  const lastSelection=useRef('');
  const svgRef=useRef<SVGSVGElement>(null),viewRef=useRef(view),pointers=useRef(new Map<number,Point>()),gesture=useRef<Gesture|null>(null);
  const viewport=usePlanViewport(svgRef);
  viewRef.current=view;
  const room=layout.rooms.find(item=>item.id===selected||item.zoneId===selected);
  const fit=()=>setView(layoutBounds(layout));
  const focusRoom=()=>{if(room)setView(layoutBounds({...layout,rooms:[room]},1.5));};
  const zoom=(ratio:number)=>{const rect=svgRef.current?.getBoundingClientRect();if(rect)setView(v=>navigateView(v,rect,{x:rect.left+rect.width/2,y:rect.top+rect.height/2},{x:rect.left+rect.width/2,y:rect.top+rect.height/2},ratio));};
  useEffect(()=>{
    const changed=lastSelection.current!==selected;lastSelection.current=selected;
    if(!room)return;
    const box=roomBounds(room.points),x=box.x+box.width/2,y=box.y+box.height/2,v=viewRef.current;
    if(changed&&window.matchMedia('(max-width:720px)').matches||x<v.x||x>v.x+v.width||y<v.y||y>v.y+v.height)focusRoom();
  },[selected,layout]);
  useEffect(()=>{
    const svg=svgRef.current;if(!svg)return;
    const wheel=(event:WheelEvent)=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();const point={x:event.clientX,y:event.clientY},rect=svg.getBoundingClientRect();setView(v=>navigateView(v,rect,point,point,Math.exp(Math.max(-.5,Math.min(.5,event.deltaY*.002)))));};
    svg.addEventListener('wheel',wheel,{passive:false});return()=>svg.removeEventListener('wheel',wheel);
  },[]);
  const metrics=()=>{const points=[...pointers.current.values()],a=points[0],b=points[1];return {point:b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:a,distance:b?Math.hypot(a.x-b.x,a.y-b.y):0};};
  const begin=(event:React.PointerEvent<SVGSVGElement>)=>{
    if(event.button!==0)return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const m=metrics(),multi=pointers.current.size>1,previous=gesture.current;
    gesture.current={view:viewRef.current,rect:event.currentTarget.getBoundingClientRect(),start:m.point,distance:m.distance,room:previous?.room||(event.target as Element).closest('[data-plan-room]')?.getAttribute('data-plan-room')||'',dragged:multi||previous?.dragged||false,multi:multi||previous?.multi||false};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:React.PointerEvent<SVGSVGElement>)=>{
    if(!pointers.current.has(event.pointerId)||!gesture.current)return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const g=gesture.current,m=metrics();
    if(!g.dragged&&Math.hypot(m.point.x-g.start.x,m.point.y-g.start.y)<5)return;
    g.dragged=true;setDragging(true);
    const next=navigateView(g.view,g.rect,g.start,m.point,g.distance&&m.distance?g.distance/m.distance:1);
    viewRef.current=next;setView(next);
  };
  const end=(event:React.PointerEvent<SVGSVGElement>,cancel=false)=>{
    if(!pointers.current.has(event.pointerId))return;
    const g=gesture.current;pointers.current.delete(event.pointerId);
    if(!cancel&&g&&!g.dragged&&!g.multi&&g.room){const hit=layout.rooms.find(item=>item.id===g.room);if(hit)onSelect(hit.zoneId||hit.id);}
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(pointers.current.size&&g){const m=metrics();gesture.current={...g,view:viewRef.current,start:m.point,distance:m.distance,dragged:true,multi:true};}
    else{gesture.current=null;setDragging(false);}
  };
  return <div className="floor-plan-view"><div className="built-plan-viewport"><svg ref={svgRef} className={`built-floor-plan ${dragging?'is-panning':''}`} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-label={p.view} aria-describedby={hintId} role="group" tabIndex={0}
    onPointerDown={begin} onPointerMove={move} onPointerUp={event=>end(event)} onPointerCancel={event=>end(event,true)} onLostPointerCapture={event=>end(event,true)} onClickCapture={event=>{if(event.detail>0){event.preventDefault();event.stopPropagation();}}}
    onKeyDown={event=>{if(event.altKey||event.ctrlKey||event.metaKey)return;const key=event.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){event.preventDefault();setView(v=>({...v,x:v.x+(key==='ArrowLeft'?-.12:key==='ArrowRight'?.12:0)*v.width,y:v.y+(key==='ArrowUp'?-.12:key==='ArrowDown'?.12:0)*v.height}));}else if(key==='+'||key==='='||key==='-'){event.preventDefault();zoom(key==='-'?1.25:.8);}else if(key==='0'||key==='Home'){event.preventDefault();fit();}}}>
    <PlanGrid/><PlanDrawing layout={layout} zones={zones} language={language} selected={selected} onSelect={onSelect} snapshot={snapshot} stale={stale} showCounts={showCounts} labelView={{view,viewport}} onHiddenLabels={setHiddenLabels}/></svg></div>
    <div className="plan-view-footer"><div className="plan-view-caption"><span>{showCounts?(stale?p.countsStale:p.countsHint):layout.example?p.sampleLabel:p.notMeasured}</span><small id={hintId}>{p.navigationHint}</small>{hiddenLabels>0&&<span className="plan-label-note">{p.labelsHidden}</span>}</div><div className="plan-view-controls"><button className="plan-count-toggle" aria-label={p.countsLabel} aria-pressed={showCounts} onClick={onToggleCounts}>ОП / ОУ</button><div className="plan-zoom"><button aria-label={p.focusRoom} title={p.focusRoom} disabled={!room} onClick={focusRoom}><Focus size={17}/></button><button aria-label={p.zoomOut} title={p.zoomOut} onClick={()=>zoom(1.25)}><Minus size={17}/></button><button aria-label={p.zoomIn} title={p.zoomIn} onClick={()=>zoom(.8)}><Plus size={17}/></button><button aria-label={p.fit} title={p.fit} onClick={fit}><Maximize2 size={17}/></button></div></div></div></div>;
}
