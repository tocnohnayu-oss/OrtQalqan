import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeftRight,ArrowRight,BookOpen,Check,ChevronDown,FileClock,Info,Layers3,MapPinOff,Pencil,Plus,RotateCcw} from 'lucide-react';
import type {Building,Floor,Language,Snapshot,Zone} from '../domain/types';
import {reviewChanges} from '../domain/change-review.mjs';
import {layoutBounds} from '../domain/layout.mjs';
import {changeWords} from '../locales/changes';
import {PlanDrawing} from './PlanDrawing';
import {usePlanViewport} from './PlanLabels';

type FieldChange={key:string;before?:unknown;after?:unknown};
type Props={building:Building;snapshot:Snapshot;language:Language;onRefresh:()=>void;onSaved:()=>void;onEdit:(id:string)=>void};
const typeName=(type:string)=>type==='OP'?'ОП':'ОУ';

export function ChangeReview({building,snapshot,language,onRefresh,onSaved,onEdit}:Props){
  const w=changeWords(language),review=useMemo(()=>reviewChanges(snapshot,building),[snapshot,building]);
  const [selected,setSelected]=useState(()=>review?.rooms[0]?.id||'');
  const [floorId,setFloorId]=useState(()=>review?.rooms[0]?.floorAfter?.id||review?.rooms[0]?.floorBefore?.id||review?.floorChanges[0]?.id||building.floors[0]?.id||'');
  const [side,setSide]=useState('after'),[listOpen,setListOpen]=useState(()=>window.matchMedia('(min-width:721px)').matches),[limit,setLimit]=useState(40);
  const heading=useRef<HTMLHeadingElement>(null);
  const name=(value?:{name:string;nameKk:string})=>value?(language==='ru'?value.name:value.nameKk):'—';
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
  useEffect(()=>{const query=window.matchMedia('(min-width:721px)'),change=()=>setListOpen(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
  if(!review)return <p className="notice">{w.foreign}</p>;
  const {rooms}=review,preview=review.preview as Snapshot,pair=review.floors.find(floor=>floor.id===floorId)||review.floors[0];
  const room=rooms.find(item=>item.id===selected),beforeFloor=room?.floorBefore||pair?.before,afterFloor=room?.floorAfter||pair?.after;
  const beforeZone=snapshot.building.floors.flatMap(f=>f.zones).find(z=>z.id===selected),afterZone=building.floors.flatMap(f=>f.zones).find(z=>z.id===selected);
  const selectedName=name(afterZone||beforeZone),oldRow=snapshot.rows.find(row=>row.zoneId===selected),newRow=preview.rows.find(row=>row.zoneId===selected);
  const pick=(id:string)=>{setSelected(id);const target=rooms.find(item=>item.id===id);if(target)setFloorId(target.floorAfter?.id||target.floorBefore?.id||floorId);if(window.matchMedia('(max-width:720px)').matches){setListOpen(false);requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));}};
  const fieldTable=(items:FieldChange[])=> <FieldTable fields={items} language={language}/>;
  return <div className="change-review" data-review-source={snapshot.id}>
    <header className="change-review-intro"><div><span className="eyebrow"><ArrowLeftRight size={14}/>{w.eyebrow}</span><h3>{name(building)}</h3><p>{w.intro}</p></div><span className="change-preview-stamp"><FileClock size={17}/>{w.preview}</span></header>
    <div className="change-total-rail" aria-label={w.count}><span className="change-total-scope">{w.all}</span>{review.totals.map(total=><section key={total.type} data-review-total={total.type}><span className="change-total-type">{typeName(total.type)}</span><div><small>{w.before}</small><strong>{snapshot.rows.some(row=>row.type)?total.before:'—'}</strong></div><ArrowRight size={23} aria-hidden="true"/><div className="change-total-after"><small>{w.after}</small><strong>{preview.rows.some(row=>row.type)?total.after:'—'}</strong></div>{total.delta!==null&&<span className={`change-total-delta ${total.delta?'has-change':''}`}>{total.delta>0?'+':''}{total.delta}</span>}</section>)}</div>
    {!review.sameRules&&<p className="change-scope-note"><Info size={17}/>{w.differentRules}<small>{snapshot.rulesVersion} → {preview.rulesVersion}</small></p>}
    {!review.changed&&<div className="change-empty"><Check size={28}/><div><strong>{w.unchanged}</strong><p>{w.unchangedHint}</p></div></div>}
    <div className="change-review-layout">
      <details className="change-index" open={listOpen} onToggle={event=>setListOpen(event.currentTarget.open)}><summary><span>{w.rooms} <b>{rooms.length}</b></span><ChevronDown size={16}/></summary><div className="change-index-body"><label className="change-floor-picker"><span>{w.floor}</span><select value={pair?.id||''} onChange={event=>{setSelected('');setFloorId(event.target.value);}}>{review.floors.map(floor=><option key={floor.id} value={floor.id}>{name(floor.after||floor.before)}</option>)}</select></label><h4>{w.rooms}<span>{rooms.length}</span></h4><div className="change-room-index">{rooms.slice(0,limit).map(item=><button className={item.id===selected?'active':''} key={item.id} aria-pressed={item.id===selected} onClick={()=>pick(item.id)}><span className={`change-kind ${item.kind}`}>{item.kind==='added'?<Plus size={14}/>:item.kind==='removed'?'−':<Pencil size={13}/>}</span><span><strong>{name(item.after||item.before)}</strong><small>{name(item.floorAfter||item.floorBefore)}</small></span><ArrowRight size={13}/></button>)}{!rooms.length&&<p className="change-index-empty">{w.emptyRooms}</p>}</div>{rooms.length>limit&&<button className="change-more" onClick={()=>setLimit(value=>value+40)}>{w.more}<Plus size={14}/></button>}</div></details>
      <div className="change-review-content">
        <div className="change-room-heading"><div><span className="eyebrow">{room?w[room.kind as 'changed'|'added'|'removed']:selected?w.unchanged:w.object}</span><h3 tabIndex={-1} ref={heading}>{selected?selectedName:name(pair?.after||pair?.before)}</h3></div>{afterZone&&<button className="button subtle small change-edit-room" aria-label={w.edit} onClick={()=>onEdit(afterZone.id)}><Pencil size={14}/><span>{w.edit}</span></button>}</div>
        <div className="change-side-switch" aria-label={w.preview}>{(['before','after'] as const).map(value=><button key={value} aria-pressed={side===value} onClick={()=>setSide(value)}>{value==='before'?<BookOpen size={15}/>:<Pencil size={15}/>} {w[value]}</button>)}</div>
        <div className="change-plans" data-mobile-side={side}>{(['before','after'] as const).map(value=>{const floor=value==='before'?beforeFloor:afterFloor,source=value==='before'?snapshot:preview,sourceZone=floor?.zones.find((zone:Zone)=>zone.id===selected);return <section className={`change-plan-pane ${value}`} key={value} aria-label={w[value]}><header><span><b>{value==='before'?'01':'02'}</b>{w[value]}</span><small>{name(floor)}{sourceZone?` · ${name(sourceZone)}`:''}</small></header><ReviewPlan floor={floor} selected={selected} snapshot={source} language={language} onPick={pick}/></section>;})}</div>
        <p className="change-plan-hint"><Info size={14}/>{w.planHint}</p>
        {selected&&<>
          <div className="change-equations" aria-label={w.round}>{([oldRow,newRow]).map((row,i)=><div key={i}><span>{i?w.after:w.before}</span>{row?<strong>{row.type?<><span>{row.area}</span><i>÷</i><span>{row.rate}</span><ArrowRight size={16}/><b>{row.count} {typeName(row.type)}</b></>:w.manual}</strong>:<small>{w.noRoom}</small>}</div>)}</div>
          {room?.resultChanged&&!room.fields.length&&!room.checks.length&&!room.assets.length&&<p className="change-effect-note">{w.scopeEffect}</p>}
          {!!room?.fields.length&&<section className="change-field-section"><h4>{w.parameters}</h4>{fieldTable(room.fields)}</section>}
          {!!room?.checks.length&&<section className="change-field-section"><h4>{w.inspection}</h4>{fieldTable(room.checks)}</section>}
          {!!room?.assets.length&&<section className="change-assets"><h4>{w.equipment}</h4>{room.assets.map(asset=><details key={asset.id} data-change-asset={asset.id}><summary><span className={'change-kind '+asset.kind}>{w[asset.kind as 'changed'|'added'|'removed']}</span><strong>{asset.after?.label||asset.before?.label}</strong><ChevronDown size={16}/></summary>{fieldTable(asset.fields)}</details>)}</section>}
        </>}
        {!!(review.object.length||review.floorChanges.length)&&<details className="change-object-fields" open={!selected}><summary><Layers3 size={16}/>{w.object}<ChevronDown size={16}/></summary>{fieldTable(review.object)}{review.floorChanges.map(floor=><section key={floor.id}><h4>{name(floor.after||floor.before)} <small>{w[floor.kind as 'changed'|'added'|'removed']}</small></h4>{fieldTable(floor.fields)}</section>)}</details>}
        {(snapshot.floorExtras.length>0||preview.floorExtras.length>0)&&<div className="change-floor-extras"><h4>{w.floorExtra}</h4><div>{[snapshot,preview].map((source,i)=><p key={i}><span>{i?w.after:w.before}</span><strong>{source.floorExtras.length?source.floorExtras.map(extra=>`${name(source.building.floors.find(floor=>floor.id===extra.floorId))}: +${extra.count} ${typeName(extra.type)}`).join(' · '):'—'}</strong></p>)}</div><small>{w.extraHint}</small></div>}
      </div>
    </div>
    <footer className="change-review-footer"><p><Info size={16}/><span><strong>{w.profile}</strong>{w.previewHint}</span></p><div><button className="button subtle" onClick={onSaved}><BookOpen size={16}/>{w.saved}</button><button className="button primary" onClick={onRefresh}><RotateCcw size={16}/>{w.refresh}<ArrowRight size={16}/></button></div></footer>
  </div>;
}

function FieldTable({fields,language}:{fields:FieldChange[];language:Language}){
  const w=changeWords(language),format=(key:string,value:unknown):string=>{
    if(value===undefined||value===null||value==='')return '—';
    if(typeof value==='boolean')return value?w.yes:w.no;
    if(typeof value==='object'){const named=value as {name?:string;nameKk?:string};return (language==='ru'?named.name:named.nameKk)||w.updated;}
    if(key==='area')return `${value} ${w.sqm}`;
    if(key==='type')return typeName(String(value));
    if(['access','marking','passport'].includes(key)){const values={unknown:w.notChecked,ok:w.ok,attention:w.attention,na:w.na};return values[value as keyof typeof values]||String(value);}
    if(['kind','usage','condition','temperature','automatic','category','hazard'].includes(key))return typeof value==='string'&&value in w?String(w[value as keyof typeof w]):String(value);
    return String(value);
  };
  return <dl className="change-field-table">{fields.map(item=>{const structural=['floorOrder','roomOrder','plan','layout'].includes(item.key);return <div key={item.key} data-change-field={item.key}><dt>{w.fields[item.key as keyof typeof w.fields]||item.key}</dt>{structural?<dd className="change-field-replaced"><Check size={14}/>{w.updated}</dd>:<><dd className="change-value-before"><span className="sr-only">{w.before}: </span>{format(item.key,item.before)}</dd><ArrowRight size={14} aria-hidden="true"/><dd className="change-value-after"><span className="sr-only">{w.after}: </span>{format(item.key,item.after)}</dd></>}</div>;})}</dl>;
}

function ReviewPlan({floor,selected,snapshot,language,onPick}:{floor?:Floor;selected:string;snapshot:Snapshot;language:Language;onPick:(id:string)=>void}){
  const w=changeWords(language),zone=floor?.zones.find(zone=>zone.id===selected),contour=!!floor?.layout?.rooms.length&&(!selected||floor.layout.rooms.some(room=>room.zoneId===selected||room.id===selected));
  const marker=floor?.markers.find(marker=>marker.zoneId===selected),image=!!floor?.plan&&(!selected||!!marker);
  if(contour)return <ContourPlan floor={floor!} selected={selected} language={language} snapshot={snapshot} onPick={onPick}/>;
  if(image)return <div className="change-plan-canvas"><div className="change-plan-image"><img src={floor!.plan} alt={w.image}/>{marker&&<button className="change-image-marker" aria-label={language==='ru'?zone?.name:zone?.nameKk} style={{left:marker.x*100+'%',top:marker.y*100+'%'}} onClick={()=>onPick(marker.zoneId)}><span>{marker.type==='OP'?'ОП':'ОУ'}</span></button>}</div></div>;
  return <div className="change-plan-missing"><MapPinOff size={32}/><p>{!floor?w.noFloor:selected&&!zone?w.noRoom:selected?w.noLocation:w.noPlan}</p></div>;
}

function ContourPlan({floor,selected,snapshot,language,onPick}:{floor:Floor;selected:string;snapshot:Snapshot;language:Language;onPick:(id:string)=>void}){
  const ref=useRef<SVGSVGElement>(null),viewport=usePlanViewport(ref),view=useMemo(()=>layoutBounds(floor.layout!,1.2),[floor.layout]),[hidden,setHidden]=useState(0),w=changeWords(language);
  return <div className="change-contour-wrap"><svg ref={ref} className="change-contour-plan" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} aria-label={language==='ru'?floor.name:floor.nameKk} tabIndex={0}><PlanDrawing layout={floor.layout!} zones={floor.zones} language={language} selected={selected} onSelect={onPick} showCounts areaSource="calculation" snapshot={snapshot} labelView={{view,viewport}} onHiddenLabels={setHidden}/></svg>{hidden>0&&<small className="change-hidden-labels">{w.hidden}: {hidden}</small>}</div>;
}
