import { useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardCheck, Box, MapPin, Plus } from 'lucide-react';
import type { Building, Language, Snapshot } from '../domain/types';
import { buildingAtlas } from '../domain/building-atlas.mjs';
import { atlasWords, type AtlasLayer } from '../locales/atlas';
import { modelWords } from '../locales/model';
import { BuildingModel3D } from './BuildingModel3D';
const stateColors:Record<string,string>={pending:'#f6f5ee',started:'#e0e8dd',visited:'#c5d9cf',attention:'#edc6ae',verify:'#e9e6d9',OP:'#eed1be',OU:'#c9dbe2',manual:'#e9e6d9',stale:'#e2e5df'};

export function AtlasLegend({language,layer,stale=false}:{language:Language;layer:AtlasLayer;stale?:boolean}) {
  const w=atlasWords(language),states=layer==='walk'?['visited','attention','verify','pending']:layer==='calculation'?stale?['stale']:['OP','OU','manual']:[];
  return <div className="atlas-legend"><div>{states.map(state=><span key={state}><i className={`atlas-swatch ${state}`} style={{backgroundColor:stateColors[state]}}/>{w[state as keyof typeof w]}</span>)}</div><p>{layer==='walk'?w.fieldHint:layer==='calculation'?(stale?w.stale:w.calcHint):w.roomHint}</p></div>;
}

type Props={building:Building;snapshot:Snapshot;language:Language;floorId:string;compact:boolean;layer:AtlasLayer;onLayer:(layer:AtlasLayer)=>void;onSelect:(id:string)=>void;onOpen:(id:string,build?:boolean)=>void;onAdd:()=>void;onWalk:(id?:string,attention?:boolean)=>void;onExample:()=>void;onRoom?:(zoneId:string,floorId:string)=>void};
export function BuildingAtlas({building,snapshot,language,floorId,compact,layer,onLayer,onSelect,onOpen,onAdd,onWalk,onExample,onRoom}:Props) {
  const w=atlasWords(language),model=useMemo(()=>buildingAtlas(building,snapshot),[building,snapshot]),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const index=Math.max(0,model.floors.findIndex(item=>item.floor.id===floorId)),current=model.floors[index],floor=current.floor;
  const hasGeometry=model.floors.some(item=>item.source==='drawing'),mw=modelWords(language);
  return <section className={`building-atlas atlas-model ${hasGeometry?'':'atlas-unbuilt'}`} aria-label={w.title}>
    <header className="building-atlas-top"><div><Box size={21}/><h2 tabIndex={-1} data-atlas-heading>{w.title}</h2>{building.demo&&<span className="atlas-demo">{w.demo}</span>}</div><div className="atlas-layer-switch" role="group" aria-label={w.layer}>{(['rooms','walk','calculation'] as const).map(value=><button key={value} aria-pressed={layer===value} onClick={()=>onLayer(value)}>{w[value]}</button>)}</div></header>
    <div className="building-atlas-body"><aside className="atlas-index"><div className="atlas-index-title"><span>{w.sheets}<b>{building.floors.length}</b></span><button className="icon-button" aria-label={language==='ru'?'Добавить этаж':'Қабат қосу'} disabled={building.floors.length>=30} onClick={onAdd}><Plus size={17}/></button></div>
      <div className="atlas-floor-index">{model.floors.map((item,i)=><button className={item.floor.id===floor.id?'selected':''} aria-pressed={item.floor.id===floor.id} aria-label={`${w.selectFloor}: ${name(item.floor)}`} key={item.floor.id} onClick={()=>onSelect(item.floor.id)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{name(item.floor)}</strong><small>{w[item.source as 'drawing'|'image'|'empty']}<i>·</i>{item.rooms.length}</small></div>{item.attention>0&&<b title={`${w.attentionCount}: ${item.attention}`}>{item.attention}</b>}</button>)}</div>
      <div className="atlas-next"><span>{w.recorded}</span><strong>{model.visited}<small> / {model.total}</small></strong>{model.next&&<><p>{name(model.next.floor)}<br/><b>{name(model.next.zone)}</b></p><button onClick={()=>onWalk(model.next?.zone.id)}><ClipboardCheck size={16}/>{model.visited===model.total?w.review:model.visited||model.next.zone.inspection?w.resume:w.start}<ArrowRight size={15}/></button></>}
        <button className="atlas-attention" aria-label={w.attentionLink} onClick={()=>onWalk('',true)}>{w.attentionLink}<span>{model.attention}</span></button>
      </div>
    </aside><div className="atlas-desk"><div className="atlas-desk-heading"><span><Box size={15}/>{mw.title}</span><span className="atlas-reference">{w.date}: <time>{building.date||'—'}</time></span></div>
      <BuildingModel3D key={building.id} building={building} model={model} language={language} selected={floor.id} layer={layer} onSelect={onSelect} onRoom={onRoom}/>
      <div className="atlas-selected-floor"><div><span>{w.sheets} {index+1} / {model.floors.length}</span><h3>{name(floor)}</h3><p>{w.mapped}: {current.mapped} / {current.rooms.length}{current.rooms.length-current.mapped>0&&<> · {w.unmapped}: {current.rooms.length-current.mapped}</>}</p></div><div><button className="atlas-step icon-button" aria-label={language==='ru'?'Предыдущий этаж':'Алдыңғы қабат'} disabled={index===0} onClick={()=>onSelect(model.floors[index-1].floor.id)}><ChevronLeft size={18}/></button><button className="atlas-step icon-button" aria-label={language==='ru'?'Следующий этаж':'Келесі қабат'} disabled={index===model.floors.length-1} onClick={()=>onSelect(model.floors[index+1].floor.id)}><ChevronRight size={18}/></button><button className="button primary" onClick={()=>onOpen(floor.id,current.source==='empty')}><MapPin size={15}/>{current.source==='empty'?w.buildFloor:w.openFloor}<ArrowRight size={15}/></button></div></div>
      {!hasGeometry&&<div className="atlas-first-plan"><div><strong>{w.noGeometry}</strong><p>{w.noGeometryBody}</p></div><button className="text-button" title={w.sampleHint} onClick={onExample}>{w.sample}<ArrowRight size={14}/></button></div>}
      <AtlasLegend language={language} layer={layer} stale={model.stale}/>
    </div></div>
  </section>;
}
