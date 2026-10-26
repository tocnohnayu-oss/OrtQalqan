import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Box, ChevronDown, Focus, Minus, Plus, RotateCcw, RotateCw, ScanLine } from 'lucide-react';
import type { Building, Language } from '../domain/types';
import type { AtlasLayer } from '../locales/atlas';
import { modelWords } from '../locales/model';
import { buildingAtlas } from '../domain/building-atlas.mjs';
import { AtlasSheet } from './AtlasSheet';

type Scene=ReturnType<typeof import('../scene/building-scene.mjs').createBuildingScene>;
type Props={building:Building;model:ReturnType<typeof buildingAtlas>;language:Language;selected:string;layer:AtlasLayer;onSelect:(id:string)=>void;onRoom?:(zoneId:string,floorId:string)=>void};
export function BuildingModel3D({building,model,language,selected,layer,onSelect,onRoom}:Props) {
  const w=modelWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<Scene|null>(null),callbacks=useRef({onSelect,onRoom});callbacks.current={onSelect,onRoom};
  const [cut,setCut]=useState(false),[height,setHeight]=useState(3),[draft,setDraft]=useState('3'),[epoch,setEpoch]=useState(0),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [picked,setPicked]=useState<{floorId:string;zoneId:string}|null>(null),hint=useId();
  const hasGeometry=model.floors.some(item=>item.source==='drawing'),modeled=model.floors.filter(item=>item.source==='drawing').length;
  const states=useMemo(()=>Object.fromEntries(model.floors.flatMap(floor=>floor.rooms.map(room=>[room.zone.id,layer==='walk'?room.field:room.calculation]))),[model,layer]);
  const config={building,selected,layer,states,height,cut},latest=useRef(config);latest.current=config;
  useEffect(()=>{
    if(!hasGeometry||!canvas.current)return;let active=true;setStatus('loading');
    void import('../scene/building-scene.mjs').then(({createBuildingScene})=>{
      if(!active||!canvas.current)return;
      engine.current=createBuildingScene(canvas.current,latest.current,{onReady:()=>{if(active)setStatus('ready');},onError:()=>{if(active)setStatus('error');},onPick:(floorId:string,zoneId?:string)=>{if(!active||!floorId)return;callbacks.current.onSelect(floorId);setPicked(zoneId?{floorId,zoneId}:null);}});
    }).catch(error=>{if(active){console.error('Building model failed',error);setStatus('error');}});
    return()=>{active=false;engine.current?.dispose();engine.current=null;};
  },[building.id,hasGeometry,epoch]);
  useEffect(()=>{engine.current?.update(config);},[building,selected,layer,states,height,cut]);
  useEffect(()=>{setPicked(value=>value?.floorId===selected?value:null);},[selected]);
  const pickedFloor=picked?building.floors.find(floor=>floor.id===picked.floorId):undefined,pickedRoom=pickedFloor?.zones.find(zone=>zone.id===picked?.zoneId);
  if(!hasGeometry)return <div className="building-model-empty"><AtlasSheet kind={building.kind||'other'}/><div><h3>{w.empty}</h3><p>{w.emptyBody}</p></div></div>;
  return <div className="building-model" data-model-status={status}>
    <div className="model-mode-bar"><div role="group" aria-label={w.title}><button aria-pressed={!cut} onClick={()=>setCut(false)}><Box size={16}/>{w.whole}</button><button aria-pressed={cut} onClick={()=>setCut(true)}><ScanLine size={16}/>{w.cut}</button></div><span>{w.modeled}: <b>{modeled} / {building.floors.length}</b></span></div>
    <div className="building-model-stage">
      <canvas ref={canvas} className="building-model-canvas" aria-label={w.title} aria-describedby={hint} role="img" tabIndex={0} onKeyDown={event=>{
        const key=event.key;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0','Home'].includes(key)){event.preventDefault();if(key==='ArrowLeft'||key==='ArrowRight')engine.current?.rotate(key==='ArrowLeft'?-.18:.18);else if(key==='ArrowUp'||key==='ArrowDown')engine.current?.rotate(0,key==='ArrowUp'?-.1:.1);else if(key==='0'||key==='Home')engine.current?.reset();else engine.current?.zoom(key==='-'?1.15:.87);}
      }}/>
      {status==='loading'&&<div className="model-status" role="status"><Box size={27}/>{w.loading}</div>}
      {status==='error'&&<div className="model-status model-failed" role="alert"><Box size={27}/><strong>{w.unavailable}</strong><p>{w.fallback}</p><button className="button subtle" onClick={()=>setEpoch(value=>value+1)}>{w.retry}</button></div>}
      {pickedRoom&&pickedFloor&&<div className="model-picked"><small>{name(pickedFloor)}</small><strong>{name(pickedRoom)}</strong><button onClick={()=>onRoom?.(pickedRoom.id,pickedFloor.id)}>{w.openRoom}<ArrowRight size={14}/></button></div>}
      {cut&&!building.floors.find(floor=>floor.id===selected)?.layout?.rooms.length&&<p className="model-missing-floor">{w.noFloor}</p>}
    </div>
    <div className="model-bottom-bar"><div className="model-camera-controls">
      <button aria-label={w.left} title={w.left} disabled={status!=='ready'} onClick={()=>engine.current?.rotate(-.35)}><RotateCcw size={18}/></button><button aria-label={w.right} title={w.right} disabled={status!=='ready'} onClick={()=>engine.current?.rotate(.35)}><RotateCw size={18}/></button>
      <button aria-label={w.zoomOut} title={w.zoomOut} disabled={status!=='ready'} onClick={()=>engine.current?.zoom(1.2)}><Minus size={18}/></button><button aria-label={w.zoomIn} title={w.zoomIn} disabled={status!=='ready'} onClick={()=>engine.current?.zoom(.82)}><Plus size={18}/></button>
      <button aria-label={w.top} title={w.top} disabled={status!=='ready'} onClick={()=>engine.current?.top()}><ScanLine size={18}/></button><button aria-label={w.reset} title={w.reset} disabled={status!=='ready'} onClick={()=>engine.current?.reset()}><Focus size={18}/></button>
    </div><p id={hint}>{w.help}<small>{w.keyboard}</small></p></div>
    <details className="model-settings"><summary><span>{w.assumption} <b>{height} {w.metres}</b></span><span>{w.settings}<ChevronDown size={13}/></span></summary><div><label className="field"><span>{w.height}</span><input type="number" min="2" max="6" step="0.1" value={draft} onChange={event=>setDraft(event.target.value)} onBlur={()=>{const value=Number(draft);if(Number.isFinite(value)&&value>=2&&value<=6)setHeight(value);else setDraft(String(height));}} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur();}}/></label><p>{w.position}{modeled<building.floors.length?' '+w.missing:''}</p></div></details>
  </div>;
}
