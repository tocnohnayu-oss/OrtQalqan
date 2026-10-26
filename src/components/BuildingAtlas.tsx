import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardCheck, Layers3, LayoutGrid, MapPin, Plus, ScanLine } from 'lucide-react';
import type { Building, Floor, Language, Snapshot } from '../domain/types';
import { buildingAtlas } from '../domain/building-atlas.mjs';
import { layoutBounds, openingGeometry } from '../domain/layout.mjs';
import { atlasWords, type AtlasLayer } from '../locales/atlas';
import { RoomFurniture } from './RoomFurniture';
import { AtlasSheet } from './AtlasSheet';

export const stateColors:Record<string,string>={pending:'#f6f5ee',started:'#e0e8dd',visited:'#c5d9cf',attention:'#edc6ae',verify:'#e9e6d9',OP:'#eed1be',OU:'#c9dbe2',manual:'#e9e6d9',stale:'#e2e5df'};

function ImageFloorPreview({floor}:{floor:Floor}) {
  const frame=useRef<HTMLDivElement>(null),[natural,setNatural]=useState({width:1,height:1}),[size,setSize]=useState({width:1,height:1});
  useLayoutEffect(()=>{const node=frame.current;if(!node)return;const measure=()=>{const scale=Math.min(node.clientWidth/natural.width,node.clientHeight/natural.height);setSize({width:natural.width*scale,height:natural.height*scale});};measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();},[natural]);
  return <div className="atlas-image-frame" ref={frame} aria-hidden="true"><div className="atlas-image-preview" style={size}><img src={floor.plan} alt="" onLoad={event=>setNatural({width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})}/>{floor.markers.map(marker=><span key={marker.id} className={marker.type.toLowerCase()} style={{left:`${marker.x*100}%`,top:`${marker.y*100}%`}}/>)}</div></div>;
}

function FloorPreview({floor,layer,model,detailed}:{floor:Floor;layer:AtlasLayer;model:ReturnType<typeof buildingAtlas>['floors'][number];detailed:boolean}) {
  const pattern=useId().replaceAll(':','');
  if(floor.layout?.rooms.length){const box=layoutBounds(floor.layout,.8);return <svg className="atlas-floor-preview" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} aria-hidden="true">
    <defs><pattern id={pattern} width=".7" height=".7" patternUnits="userSpaceOnUse"><rect width=".7" height=".7" fill="#f0eee3"/><path d="M-.2 .7.7-.2M.5 .9.9 .5" stroke="#bfc4b3" strokeWidth=".09"/></pattern></defs>
    {floor.layout.rooms.map(room=>{const data=model.rooms.find(item=>item.zone.id===room.zoneId),state=layer==='walk'?data?.field:layer==='calculation'?data?.calculation:undefined;return <g key={room.id} data-atlas-room={room.id} data-atlas-state={state}>
      <path d={room.points.map((point,index)=>`${index?'L':'M'}${point.x} ${point.y}`).join(' ')+'Z'} fill={state==='verify'||state==='manual'?`url(#${pattern})`:state?stateColors[state]:room.zoneId?'#fffdf8':'#e9eee3'} stroke="#344f48" strokeWidth=".14"/>
      {detailed&&<RoomFurniture room={room}/>}
    </g>;})}
    {floor.layout.openings.map(opening=>{const room=floor.layout!.rooms.find(room=>room.id===opening.roomId);if(!room)return null;const g=openingGeometry(room,opening);return <g key={opening.id}><path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#fffdf8" strokeWidth=".24"/>{opening.type==='door'?<path d={`M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y} ${g.arc}`} fill="none" stroke="#567064" strokeWidth=".045"/>:<path d={`M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}`} stroke="#668895" strokeWidth=".1"/>}</g>;})}
  </svg>;}
  if(floor.plan)return <ImageFloorPreview floor={floor}/>;
  return null;
}

export function AtlasLegend({language,layer,stale=false}:{language:Language;layer:AtlasLayer;stale?:boolean}) {
  const w=atlasWords(language),states=layer==='walk'?['visited','attention','verify','pending']:layer==='calculation'?stale?['stale']:['OP','OU','manual']:[];
  return <div className="atlas-legend"><div>{states.map(state=><span key={state}><i className={`atlas-swatch ${state}`} style={{backgroundColor:stateColors[state]}}/>{w[state as keyof typeof w]}</span>)}</div><p>{layer==='walk'?w.fieldHint:layer==='calculation'?(stale?w.stale:w.calcHint):w.roomHint}</p></div>;
}

type Props={building:Building;snapshot:Snapshot;language:Language;floorId:string;compact:boolean;layer:AtlasLayer;onLayer:(layer:AtlasLayer)=>void;onSelect:(id:string)=>void;onOpen:(id:string,build?:boolean)=>void;onAdd:()=>void;onWalk:(id?:string,attention?:boolean)=>void;onExample:()=>void};
export function BuildingAtlas({building,snapshot,language,floorId,compact,layer,onLayer,onSelect,onOpen,onAdd,onWalk,onExample}:Props) {
  const w=atlasWords(language),model=buildingAtlas(building,snapshot),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const [view,setView]=useState<'spread'|'flat'>('spread');
  const index=Math.max(0,model.floors.findIndex(item=>item.floor.id===floorId)),current=model.floors[index],floor=current.floor;
  const start=Math.min(Math.max(0,index-2),Math.max(0,model.floors.length-5)),visible=model.floors.slice(start,start+5);
  const flat=compact||view==='flat',hasGeometry=model.floors.some(item=>item.source!=='empty');
  return <section className={`building-atlas ${flat?'atlas-flat':'atlas-spread'} ${hasGeometry?'':'atlas-unbuilt'}`} aria-label={w.title}>
    <header className="building-atlas-top"><div><Layers3 size={21}/><h2 tabIndex={-1} data-atlas-heading>{w.title}</h2>{building.demo&&<span className="atlas-demo">{w.demo}</span>}</div><div className="atlas-layer-switch" role="group" aria-label={w.layer}>{(['rooms','walk','calculation'] as const).map(value=><button key={value} aria-pressed={layer===value} onClick={()=>onLayer(value)}>{w[value]}</button>)}</div></header>
    <div className="building-atlas-body"><aside className="atlas-index"><div className="atlas-index-title"><span>{w.sheets}<b>{building.floors.length}</b></span><button className="icon-button" aria-label={language==='ru'?'Добавить этаж':'Қабат қосу'} disabled={building.floors.length>=30} onClick={onAdd}><Plus size={17}/></button></div>
      <div className="atlas-floor-index">{model.floors.map((item,i)=><button className={item.floor.id===floor.id?'selected':''} aria-pressed={item.floor.id===floor.id} aria-label={`${w.selectFloor}: ${name(item.floor)}`} key={item.floor.id} onClick={()=>onSelect(item.floor.id)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{name(item.floor)}</strong><small>{w[item.source as 'drawing'|'image'|'empty']}<i>·</i>{item.rooms.length}</small></div>{item.attention>0&&<b title={`${w.attentionCount}: ${item.attention}`}>{item.attention}</b>}</button>)}</div>
      <div className="atlas-next"><span>{w.recorded}</span><strong>{model.visited}<small> / {model.total}</small></strong>{model.next&&<><p>{name(model.next.floor)}<br/><b>{name(model.next.zone)}</b></p><button onClick={()=>onWalk(model.next?.zone.id)}><ClipboardCheck size={16}/>{model.visited===model.total?w.review:model.visited||model.next.zone.inspection?w.resume:w.start}<ArrowRight size={15}/></button></>}
        <button className="atlas-attention" aria-label={w.attentionLink} onClick={()=>onWalk('',true)}>{w.attentionLink}<span>{model.attention}</span></button>
      </div>
    </aside><div className="atlas-desk"><div className="atlas-desk-heading"><span><ScanLine size={15}/>{w[flat?'flat':'spread']}</span>{!compact&&<div role="group" aria-label={w.view}><button aria-label={w.spread} aria-pressed={!flat} onClick={()=>setView('spread')}><Layers3 size={17}/></button><button aria-label={w.flat} aria-pressed={flat} onClick={()=>setView('flat')}><LayoutGrid size={17}/></button></div>}</div>
      <div className="atlas-stack" style={{'--sheet-count':visible.length} as React.CSSProperties}>
        {[...visible].reverse().map((item,i)=>{const active=item.floor.id===floor.id,ordinal=building.floors.findIndex(f=>f.id===item.floor.id)+1;return <button className={`atlas-paper ${active?'selected':''} ${item.source==='empty'?'is-empty':''}`} style={{'--sheet-position':i} as React.CSSProperties} key={item.floor.id} aria-label={`${w.openFloor}: ${name(item.floor)}`} onClick={()=>onOpen(item.floor.id)}>
          <span className="atlas-paper-heading"><b>{String(ordinal).padStart(2,'0')}</b><strong>{name(item.floor)}</strong><ArrowRight size={15}/></span>
          <div className="atlas-paper-drawing">{item.source==='empty'?<div className="atlas-paper-empty"><span className="atlas-empty-mark" aria-hidden="true"><i/><i/><i/></span><span>{w.noPlan}</span></div>:<FloorPreview floor={item.floor} layer={layer} model={item} detailed={active}/>}</div>
          <span className="atlas-paper-foot"><span>{w[item.source as 'drawing'|'image'|'empty']}</span><span>{item.rooms.length} · {w.rooms.toLowerCase()}</span></span>
        </button>;})}
        {!hasGeometry&&<div className="atlas-empty-art" aria-hidden="true"><span>{language==='ru'?'Готовые блоки':'Дайын блоктар'}</span><AtlasSheet kind={building.kind||'other'}/></div>}
      </div>
      <div className="atlas-selected-floor"><div><span>{w.sheets} {index+1} / {model.floors.length}</span><h3>{name(floor)}</h3><p>{w.mapped}: {current.mapped} / {current.rooms.length}{current.rooms.length-current.mapped>0&&<> · {w.unmapped}: {current.rooms.length-current.mapped}</>}</p></div><div><button className="atlas-step icon-button" aria-label={language==='ru'?'Предыдущий этаж':'Алдыңғы қабат'} disabled={index===0} onClick={()=>onSelect(model.floors[index-1].floor.id)}><ChevronLeft size={18}/></button><button className="atlas-step icon-button" aria-label={language==='ru'?'Следующий этаж':'Келесі қабат'} disabled={index===model.floors.length-1} onClick={()=>onSelect(model.floors[index+1].floor.id)}><ChevronRight size={18}/></button><button className="button primary" onClick={()=>onOpen(floor.id,current.source==='empty')}><MapPin size={15}/>{current.source==='empty'?w.buildFloor:w.openFloor}<ArrowRight size={15}/></button></div></div>
      {!hasGeometry&&<div className="atlas-first-plan"><div><strong>{w.noGeometry}</strong><p>{w.noGeometryBody}</p></div><button className="text-button" title={w.sampleHint} onClick={onExample}>{w.sample}<ArrowRight size={14}/></button></div>}
      <AtlasLegend language={language} layer={layer} stale={model.stale}/><p className="atlas-source-note">{current.source==='image'?w.imageHint:w.sourceHint}</p>
    </div></div>
  </section>;
}
