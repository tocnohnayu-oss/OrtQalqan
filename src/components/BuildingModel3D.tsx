import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, CalendarDays, ChevronDown, ClipboardCheck, ClipboardList, Focus, Maximize2, Minus, Plus, RotateCcw, RotateCw, ScanLine, Search, Tags, X } from 'lucide-react';
import type { Building, Language } from '../domain/types';
import { atlasWords, type AtlasLayer } from '../locales/atlas';
import { modelWords } from '../locales/model';
import { buildingAtlas } from '../domain/building-atlas.mjs';
import { placeModelLabels } from '../domain/model-labels.mjs';
import { captureModelSession, restoreModelSession } from '../domain/model-session.mjs';
import { AtlasSheet } from './AtlasSheet';
import { RoomGlyph } from './RoomGlyph';

type Scene=ReturnType<typeof import('../scene/building-scene.mjs').createBuildingScene>;
type Projection={width:number;height:number;points:{id:string;x:number;y:number;depth:number}[]};
type ModelRoom=ReturnType<typeof buildingAtlas>['floors'][number]['rooms'][number];
export type ModelViewSession={current:ReturnType<typeof captureModelSession>|null};
export type ModelLocateRequest={buildingId:string;floorId:string;zoneId:string;token:number};
type Props={building:Building;model:ReturnType<typeof buildingAtlas>;language:Language;selected:string;layer:AtlasLayer;viewSession:ModelViewSession;locate:ModelLocateRequest|null;onLocated:(token:number)=>void;onLayer:(layer:AtlasLayer)=>void;onSelect:(id:string)=>void;onSearch:()=>void;onAttention:(zoneId?:string)=>void;onRoom?:(zoneId:string,floorId:string)=>void;onInspect?:(zoneId:string)=>void};

export function BuildingModel3D({building,model,language,selected,layer,viewSession,locate,onLocated,onLayer,onSelect,onSearch,onAttention,onRoom,onInspect}:Props) {
  const w=modelWords(language),aw=atlasWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const root=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),expandButton=useRef<HTMLButtonElement>(null),engine=useRef<Scene|null>(null);
  const callbacks=useRef({onSelect,onLocated});callbacks.current={onSelect,onLocated};
  const [initialView]=useState(()=>restoreModelSession(building,viewSession.current,selected)),initialCamera=useRef(initialView.camera);
  const [cut,setCut]=useState(initialView.cut),[height,setHeight]=useState(initialView.height),[draft,setDraft]=useState(String(initialView.height)),[epoch,setEpoch]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [picked,setPicked]=useState<{floorId:string;zoneId:string}|null>(()=>initialView.zoneId?{floorId:selected,zoneId:initialView.zoneId}:null),[labelsOn,setLabelsOn]=useState(initialView.labelsOn),[expanded,setExpanded]=useState(initialView.expanded);
  const [projection,setProjection]=useState<Projection>({width:0,height:0,points:[]});
  const pendingFocus=useRef(''),hint=useId(),viewerId=useId(),headingId=useId();
  const current=model.floors.find(item=>item.floor.id===selected)||model.floors[0],floor=current.floor;
  const pickedData=picked?.floorId===selected?current.rooms.find(room=>room.zone.id===picked.zoneId):undefined;
  const pickedShape=pickedData?floor.layout?.rooms.find(room=>room.zoneId===pickedData.zone.id):undefined;
  const hasGeometry=model.floors.some(item=>item.source==='drawing'),modeled=model.floors.filter(item=>item.source==='drawing').length;
  const states=useMemo(()=>Object.fromEntries(model.floors.flatMap(item=>item.rooms.map(room=>[room.zone.id,layer==='walk'?room.field:room.calculation]))),[model,layer]);
  const selectedZone=pickedData?.zone.id||'';
  const config={building,selected,layer,states,height,cut,selectedZone,labelsOn,expanded},latest=useRef(config);latest.current=config;
  const formatter=useMemo(()=>new Intl.NumberFormat(language==='ru'?'ru-RU':'kk-KZ',{maximumFractionDigits:2}),[language]);
  const caption=(room:ModelRoom)=>layer==='walk'?aw[room.field as keyof typeof aw]:layer==='calculation'?(room.count===null?aw[room.calculation as keyof typeof aw]:aw[room.calculation as 'OP'|'OU']+' × '+room.count):room.zone.area>0?formatter.format(room.zone.area)+' м²':w.areaUnknown;
  const rooms=new Map(current.rooms.map(room=>[room.zone.id,room]));
  const annotations=placeModelLabels(projection.points.filter(point=>rooms.has(point.id)).map(point=>({...point,name:name(rooms.get(point.id)!.zone),detail:caption(rooms.get(point.id)!),priority:rooms.get(point.id)!.field==='attention'?1:0})),projection,selectedZone);

  useEffect(()=>{
    if(!hasGeometry||!canvas.current)return;
    let active=true;setStatus('loading');
    void import('../scene/building-scene.mjs').then(({createBuildingScene})=>{
      if(!active||!canvas.current)return;
      engine.current=createBuildingScene(canvas.current,latest.current,{
        onReady:()=>{if(active)setStatus('ready');},onError:()=>{if(active)setStatus('error');},
        onProject:(value:Projection)=>{if(active)setProjection(value);},
        onPick:(floorId:string,zoneId?:string)=>{if(!active||!floorId)return;callbacks.current.onSelect(floorId);setPicked(zoneId?{floorId,zoneId}:null);if(zoneId)setCut(true);},
      });
      if(initialCamera.current){engine.current.restoreView(initialCamera.current);initialCamera.current=null;}
    }).catch(error=>{if(active){console.error('Building model failed',error);setStatus('error');}});
    return()=>{active=false;const value=latest.current;viewSession.current=captureModelSession(value.building,{floorId:value.selected,zoneId:value.selectedZone,cut:value.cut,height:value.height,labelsOn:value.labelsOn,expanded:value.expanded,camera:engine.current?.captureView()||null});engine.current?.dispose();engine.current=null;};
  },[building.id,hasGeometry,epoch]);
  useEffect(()=>{if(!locate||locate.buildingId!==building.id||locate.floorId!==selected)return;setPicked({floorId:selected,zoneId:locate.zoneId});setCut(true);pendingFocus.current=locate.zoneId;callbacks.current.onLocated(locate.token);},[locate?.token,building.id,selected]);
  useEffect(()=>{
    engine.current?.update(config);
    if(pendingFocus.current&&engine.current&&cut&&selectedZone===pendingFocus.current){engine.current.focusRoom(pendingFocus.current);pendingFocus.current='';}
  },[building,selected,layer,states,height,cut,selectedZone,labelsOn,status,locate?.token]);
  useEffect(()=>{setPicked(value=>value?.floorId===selected?value:null);},[selected]);
  useEffect(()=>{if(!hasGeometry)setExpanded(false);},[hasGeometry]);
  useLayoutEffect(()=>{
    if(!expanded||!root.current)return;
    const viewer=root.current,documentRoot=document.documentElement,overflow=documentRoot.style.overflow,scroll={x:window.scrollX,y:window.scrollY};
    const inactive:HTMLElement[]=[];
    for(let branch:HTMLElement|null=viewer;branch&&branch!==document.body;branch=branch.parentElement){
      for(const sibling of branch.parentElement?.children||[])if(sibling!==branch&&sibling instanceof HTMLElement&&!sibling.inert){sibling.inert=true;inactive.push(sibling);}
    }
    documentRoot.style.overflow='hidden';
    const frame=requestAnimationFrame(()=>document.getElementById(headingId)?.focus({preventScroll:true}));
    const key=(event:KeyboardEvent)=>{
      if(document.querySelector('dialog[open]')||event.defaultPrevented)return;
      if(event.key==='Escape'&&!(event.target instanceof Element&&event.target.closest('input,select,textarea,[contenteditable=true]'))){event.preventDefault();setExpanded(false);}
      if(event.key==='Tab'){
        const targets=Array.from(viewer.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')).filter(node=>node.getClientRects().length&&!node.closest('[inert]'));
        const first=targets[0],last=targets.at(-1);if(!first)return;
        if(event.shiftKey&&(document.activeElement===first||!targets.includes(document.activeElement as HTMLElement))){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!targets.includes(document.activeElement as HTMLElement))){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',key);
    return()=>{
      cancelAnimationFrame(frame);document.removeEventListener('keydown',key);for(const element of inactive)element.inert=false;documentRoot.style.overflow=overflow;
      requestAnimationFrame(()=>{if(expandButton.current?.isConnected){window.scrollTo(scroll.x,scroll.y);expandButton.current.focus({preventScroll:true});}});
    };
  },[expanded,headingId,hasGeometry]);

  const chooseRoom=(id:string,focus=false)=>{setPicked(id?{floorId:selected,zoneId:id}:null);if(id){setCut(true);if(focus)pendingFocus.current=id;}};
  if(!hasGeometry)return <div className="building-model-empty"><AtlasSheet kind={building.kind||'other'}/><div><h3>{w.empty}</h3><p>{w.emptyBody}</p></div></div>;
  return <div ref={root} id={viewerId} className={'building-model'+(expanded?' model-expanded':'')} data-model-status={status} role={expanded?'dialog':'region'} aria-modal={expanded||undefined} aria-label={!expanded?w.title:undefined} aria-labelledby={expanded?headingId:undefined}>
    {expanded&&<header className="model-focus-bar"><Box size={23}/><div><h2 id={headingId} tabIndex={-1}>{name(building)}</h2><span>{building.demo?aw.demo:w.title}</span></div><button className="model-focus-search" aria-label={aw.searchTitle} title={aw.searchTitle} onClick={onSearch}><Search size={19}/></button><button className="button subtle" onClick={()=>setExpanded(false)}><ArrowLeft size={16}/>{w.exit}</button></header>}
    {expanded&&<div className="model-focus-layers" role="group" aria-label={aw.layer}>{(['rooms','walk','calculation'] as const).map(value=><button key={value} aria-pressed={layer===value} onClick={()=>onLayer(value)}>{aw[value]}</button>)}</div>}
    <div className="model-mode-bar"><div role="group" aria-label={w.title}><button aria-pressed={!cut} onClick={()=>setCut(false)}><Box size={16}/>{w.whole}</button><button aria-pressed={cut} onClick={()=>setCut(true)}><ScanLine size={16}/>{w.cut}</button></div><div className="model-view-tools">
      {layer==='walk'&&<button className="model-attention-open" aria-label={w.attentionObject} title={w.attentionObject} onClick={()=>onAttention()}><ClipboardList size={16}/><span>{w.attentionShort}</span><b>{model.attention}</b></button>}
      {cut&&<button className="model-label-toggle" aria-label={w.labels} title={w.labels} aria-pressed={labelsOn} onClick={()=>setLabelsOn(value=>!value)}><Tags size={17}/><span>{w.labelsShort}</span></button>}
      {!expanded&&<button ref={expandButton} className="model-expand" aria-label={w.expand} title={w.expand} aria-haspopup="dialog" aria-controls={viewerId} onClick={()=>setExpanded(true)}><Maximize2 size={17}/><span>{w.expandShort}</span></button>}
    </div></div>
    <div className="model-context-bar"><label><span>{w.floor}</span><select aria-label={w.chooseFloor} value={selected} onChange={event=>onSelect(event.target.value)}>{model.floors.map(item=><option value={item.floor.id} key={item.floor.id}>{name(item.floor)}</option>)}</select></label><label><span>{w.room}</span><select aria-label={w.chooseRoom} value={selectedZone} onChange={event=>chooseRoom(event.target.value,true)}><option value="">{w.roomPlaceholder}</option>{current.rooms.map(room=><option key={room.zone.id} value={room.zone.id}>{name(room.zone)}{floor.layout?.rooms.some(shape=>shape.zoneId===room.zone.id)?'':' · '+w.noContour}</option>)}</select></label></div>
    <div className="building-model-stage">
      <canvas ref={canvas} className="building-model-canvas" aria-label={w.title} aria-describedby={hint} role="img" tabIndex={0} onKeyDown={event=>{
        const key=event.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0','Home'].includes(key)){event.preventDefault();if(key==='ArrowLeft'||key==='ArrowRight')engine.current?.rotate(key==='ArrowLeft'?-.18:.18);else if(key==='ArrowUp'||key==='ArrowDown')engine.current?.rotate(0,key==='ArrowUp'?-.1:.1);else if(key==='0'||key==='Home')engine.current?.reset();else engine.current?.zoom(key==='-'?1.15:.87);}
      }}/>
      {status==='ready'&&cut&&labelsOn&&<div className="model-labels" aria-label={w.labels}>
        <svg aria-hidden="true" width="100%" height="100%">{annotations.labels.map(label=><line key={label.id} x1={label.anchor.x} y1={label.anchor.y} x2={label.x+label.width/2} y2={label.y+label.height/2}/>)}</svg>
        {annotations.labels.map(label=>{const room=rooms.get(label.id)!;return <button key={label.id} className={'model-room-label'+(label.id===selectedZone?' is-selected':'')} data-model-room={label.id} data-room-state={layer==='walk'?room.field:layer==='calculation'?room.calculation:'rooms'} aria-label={w.selectRoom+': '+name(room.zone)} aria-pressed={label.id===selectedZone} title={name(room.zone)+' · '+caption(room)} style={{left:label.x,top:label.y,width:label.width,height:label.height}} onClick={()=>chooseRoom(label.id)}><strong>{name(room.zone)}</strong><span><i/><span>{caption(room)}</span></span></button>;})}
      </div>}
      {status==='loading'&&<div className="model-status" role="status"><Box size={27}/>{w.loading}</div>}
      {status==='error'&&<div className="model-status model-failed" role="alert"><Box size={27}/><strong>{w.unavailable}</strong><p>{w.fallback}</p><button className="button subtle" onClick={()=>setEpoch(value=>value+1)}>{w.retry}</button></div>}
      {cut&&!floor.layout?.rooms.length&&<p className="model-missing-floor">{w.noFloor}</p>}
    </div>
    {pickedData&&<div className="model-room-sheet" data-selected-room={selectedZone}>
      <RoomGlyph preset={pickedShape?.preset} placed={!!pickedShape}/><div className="model-room-context"><small>{name(floor)}</small><h3>{name(pickedData.zone)}</h3><p aria-live="polite">{!pickedShape?w.noContour:layer==='rooms'?w.areaLabel+': '+caption(pickedData):caption(pickedData)}</p>{pickedData.attention>0&&<button className="model-room-evidence" aria-label={w.roomEvidence} onClick={()=>onAttention(selectedZone)}><ClipboardList size={15}/>{w.evidence}<b>{pickedData.attention}</b><ArrowRight size={13}/></button>}</div>
      <div className="model-room-actions"><button className="model-room-locate" aria-label={w.focusRoom} title={w.focusRoom} disabled={!pickedShape||status!=='ready'} onClick={()=>engine.current?.focusRoom(selectedZone)}><Focus size={17}/></button>{onInspect&&<button onClick={()=>onInspect(selectedZone)}><ClipboardCheck size={16}/>{w.inspect}</button>}<button className="model-room-open" onClick={()=>{setExpanded(false);onRoom?.(selectedZone,selected);}}>{w.openRoom}<ArrowRight size={15}/></button><button className="model-room-clear" aria-label={w.clearRoom} title={w.clearRoom} onClick={()=>{setPicked(null);canvas.current?.focus({preventScroll:true});}}><X size={17}/></button></div>
    </div>}
    <div className="model-bottom-bar"><div className="model-camera-controls">
      <button aria-label={w.left} title={w.left} disabled={status!=='ready'} onClick={()=>engine.current?.rotate(-.35)}><RotateCcw size={18}/></button><button aria-label={w.right} title={w.right} disabled={status!=='ready'} onClick={()=>engine.current?.rotate(.35)}><RotateCw size={18}/></button>
      <button aria-label={w.zoomOut} title={w.zoomOut} disabled={status!=='ready'} onClick={()=>engine.current?.zoom(1.2)}><Minus size={18}/></button><button aria-label={w.zoomIn} title={w.zoomIn} disabled={status!=='ready'} onClick={()=>engine.current?.zoom(.82)}><Plus size={18}/></button>
      <button aria-label={w.top} title={w.top} disabled={status!=='ready'} onClick={()=>engine.current?.top()}><ScanLine size={18}/></button><button aria-label={w.reset} title={w.reset} disabled={status!=='ready'} onClick={()=>engine.current?.reset()}><Focus size={18}/></button>
    </div><p id={hint}>{w.help}<small>{w.keyboard}</small></p>{expanded&&<span className="model-reference-date"><CalendarDays size={14}/><span>{aw.date}:</span><time dateTime={building.date}>{building.date||'—'}</time></span>}</div>
    <details className="model-settings"><summary><span>{w.modeled}: <b>{modeled} / {building.floors.length}</b> · {w.heightShort} <b>{height} {w.metres}</b></span><span>{w.settings}<ChevronDown size={13}/></span></summary><div><label className="field"><span>{w.height}</span><input type="number" min="2" max="6" step="0.1" value={draft} onChange={event=>setDraft(event.target.value)} onBlur={()=>{const value=Number(draft);if(Number.isFinite(value)&&value>=2&&value<=6)setHeight(value);else setDraft(String(height));}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/></label><p>{w.position}{modeled<building.floors.length?' '+w.missing:''}</p></div></details>
  </div>;
}
