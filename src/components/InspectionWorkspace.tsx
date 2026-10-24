import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, ChevronRight, CircleAlert, ClipboardCheck, Clock3, Download, Fingerprint, ListChecks, MapPin, Plus, Search, Tag, Trash2, Wrench, X, ChevronDown, FileDown } from 'lucide-react';
import type { Asset, Building, CheckAnswer, Inspection, Language, Zone } from '../domain/types';
import { CHECK_KEYS, EMPTY_INSPECTION, inspectionReady, inspectionStatus, inspectionSummary, needsAttention, serviceStatus, validDate } from '../domain/inspection.mjs';
import { fieldWords } from '../locales/inspection';
import { SceneIllustration, sceneForZone } from './Scenes';

type Props = { building:Building; initialZoneId:string; language:Language; onUpdate:(id:string,patch:Partial<Zone>)=>void; onLocate:(id:string)=>void; onExport:()=>void; onDirtyChange:(dirty:boolean)=>void;onReport:()=>void };
type Filter = 'all'|'pending'|'attention';
const checkKeys = CHECK_KEYS as (keyof Pick<Inspection,'access'|'marking'|'passport'>)[];
const newAsset = ():Asset => ({id:crypto.randomUUID(),label:'',model:'',type:'OP',condition:'unknown',nextService:''});

export function InspectionWorkspace({building,initialZoneId,language,onUpdate,onLocate,onExport,onDirtyChange,onReport}:Props) {
  const w=fieldWords(language), name=(x:{name:string;nameKk:string})=>language==='ru'?x.name:x.nameKk;
  const entries=building.floors.flatMap(f=>f.zones.map(z=>({floor:f,zone:z})));
  const [selected,setSelected]=useState(initialZoneId);
  const [listOpen,setListOpen]=useState(()=>window.matchMedia('(min-width:721px)').matches);
  useEffect(()=>{const query=window.matchMedia('(min-width:721px)'),update=()=>setListOpen(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
  const [assetDirty,setAssetDirty]=useState(false);
  const editState=useCallback((dirty:boolean)=>{setAssetDirty(dirty);onDirtyChange(dirty);},[onDirtyChange]);
  const select=(id:string)=>{if(id===selected)return;if(assetDirty&&!window.confirm(w.discardDraft))return;setSelected(id);if(window.matchMedia('(max-width:720px)').matches)setListOpen(false);};
  const [filter,setFilter]=useState<Filter>('all'), [search,setSearch]=useState('');
  const current=entries.find(x=>x.zone.id===selected)||entries[0];
  const summary=inspectionSummary(building);
  const query=search.trim().toLocaleLowerCase();
  const visible=entries.filter(({zone:z})=>(!query||`${z.name} ${z.nameKk}`.toLocaleLowerCase().includes(query))&&(filter==='all'||filter==='pending'&&inspectionStatus(z,building.date)!=='visited'||filter==='attention'&&needsAttention(z,building.date)));
  const currentIndex=entries.findIndex(x=>x.zone.id===current?.zone.id);
  const next=[...entries.slice(currentIndex+1),...entries.slice(0,currentIndex)].find(x=>inspectionStatus(x.zone,building.date)!=='visited');
  return <div className="inspection-workspace">
    <div className="walk-simple-top"><div><strong>{name(building)}</strong><span>{w.visited}: {summary.visited} / {summary.total}<i>·</i>{w.attention}: {summary.attention}</span></div><div><button className="icon-button" aria-label={w.export} title={w.export} disabled={!summary.assets||assetDirty} onClick={onExport}><Download size={17}/></button><button className="button subtle small" disabled={assetDirty} onClick={onReport}><FileDown size={15}/>{w.report}</button></div></div>
    <div className="walk-body">
      <details className="walk-sidebar-toggle" open={listOpen} onToggle={e=>setListOpen(e.currentTarget.open)}><summary><span>{w.roomList}</span><strong>{current?name(current.zone):'—'}</strong><ChevronDown size={15}/></summary><aside className="walk-sidebar"><label className="walk-search"><Search size={16}/><input type="search" aria-label={w.search} placeholder={w.search} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label={w.cancel} onClick={()=>setSearch('')}><X size={14}/></button>}</label>
        <div className="walk-filters" aria-label={w.review}>{(['all','pending','attention'] as const).map(f=><button key={f} aria-pressed={filter===f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f==='attention'?<CircleAlert size={12}/>:null}{f==='pending'?w.remaining:w[f]}<span>{f==='all'?summary.total:f==='pending'?summary.total-summary.visited:summary.attention}</span></button>)}</div>
        <div className="walk-room-list">{building.floors.map(f=>{const items=visible.filter(x=>x.floor.id===f.id);return items.length?<section key={f.id}><h3>{name(f)}</h3>{items.map(({zone:z})=>{const status=inspectionStatus(z,building.date),attention=needsAttention(z,building.date);return <button key={z.id} onClick={()=>select(z.id)} className={`walk-room ${current?.zone.id===z.id?'active':''}`} aria-pressed={current?.zone.id===z.id}><span className={`walk-room-state ${attention?'attention':status}`}>{attention?<CircleAlert size={15}/>:status==='visited'?<Check size={15}/>:<span/>}</span><span><strong>{name(z)}</strong><small>{w[status]}{z.assets?.length?` · ${z.assets.length} ${w.assetCount}`:''}</small></span><ChevronRight size={13}/></button>;})}</section>:null;})}{!visible.length&&<div className="walk-no-match"><Search size={24}/><p>{w.empty}</p><small>{w.emptyHint}</small></div>}</div>
      </aside></details>
      {current?<RoomRecord key={current.zone.id} zone={current.zone} floorName={name(current.floor)} index={currentIndex+1} total={summary.total} date={building.date} language={language} onUpdate={patch=>onUpdate(current.zone.id,patch)} onLocate={()=>{if(!assetDirty||window.confirm(w.discardDraft))onLocate(current.zone.id);}} onNext={next?()=>select(next.zone.id):undefined} onDirtyChange={editState}/>:<div className="walk-no-match"><ListChecks size={34}/><p>{w.empty}</p><small>{w.emptyHint}</small></div>}
    </div>
  </div>;
}

function RoomRecord({zone,date,language,floorName,index,total,onUpdate,onLocate,onNext,onDirtyChange}:{zone:Zone;date:string;language:Language;floorName:string;index:number;total:number;onUpdate:(patch:Partial<Zone>)=>void;onLocate:()=>void;onNext?:(()=>void);onDirtyChange:(dirty:boolean)=>void}) {
  const w=fieldWords(language), name=language==='ru'?zone.name:zone.nameKk;
  const inspection=zone.inspection||EMPTY_INSPECTION as Inspection;
  const visited=inspectionStatus(zone,date)==='visited';
  const [editing,setEditing]=useState<Asset|null>(null), [error,setError]=useState('');
  const formId=useId(),heading=useRef<HTMLHeadingElement>(null);
  const [assetsOpen,setAssetsOpen]=useState(false);
  const unanswered=checkKeys.filter(key=>inspection[key]==='unknown').length;
  useEffect(()=>{heading.current?.focus({preventScroll:true});const modal=heading.current?.closest('dialog');if(modal)modal.scrollTop=0;},[zone.id]);
  useEffect(()=>{onDirtyChange(!!editing);return()=>onDirtyChange(false);},[!!editing,onDirtyChange]);
  const changeCheck=(key:typeof checkKeys[number],value:CheckAnswer)=>onUpdate({inspection:{...inspection,[key]:value,checkedOn:undefined}});
  const saveAsset=()=>{
    if(!editing)return;
    const asset={...editing,label:editing.label.trim(),model:editing.model.trim()};
    if(!asset.label){setError(w.required);return;}
    if(zone.assets?.some(a=>a.id!==asset.id&&a.label.trim().toLocaleLowerCase()===asset.label.toLocaleLowerCase())){setError(w.duplicate);return;}
    if(asset.nextService&&!validDate(asset.nextService)){setError(w.invalidDate);return;}
    const assets=zone.assets?.some(a=>a.id===asset.id)?zone.assets.map(a=>a.id===asset.id?asset:a):[...(zone.assets||[]),asset];
    onUpdate({assets,inspection:{...inspection,checkedOn:undefined}});setEditing(null);setError('');
  };
  const conditionLabel=(a:Asset)=>w[a.condition];
  return <section className="walk-record" aria-label={name}>
    <div className="walk-room-heading"><div><span className="eyebrow">{floorName} · {w.roomStep} {index} / {total}</span><h3 tabIndex={-1} ref={heading}>{name}</h3><button className="text-button" onClick={onLocate}><MapPin size={13}/>{w.backToMap}<ArrowRight size={13}/></button></div><SceneIllustration scene={sceneForZone(zone)}/></div>
    <div className="walk-checks quick-walk-checks"><div className="walk-section-title"><h4>{w.checks}</h4><span>{unanswered?`${w.checksLeft}: ${unanswered}`:w.answersReady}</span></div>
      {checkKeys.map((key,index)=><fieldset aria-label={w[key]} className={`quick-check ${inspection[key]==='attention'?'has-issue':''}`} key={key}><legend><span>{index+1}</span>{w[key]}</legend><p>{w[`${key}Hint`]}</p><div className="quick-check-options">{(['ok','attention','na'] as const).map(answer=><label className={`quick-answer ${answer}`} key={answer}><input type="radio" name={`${formId}-${key}`} value={answer} checked={inspection[key]===answer} onChange={()=>changeCheck(key,answer)}/><span>{answer==='ok'?<Check size={14}/>:answer==='attention'?<CircleAlert size={14}/>:null}{answer==='ok'?w.quickOk:answer==='attention'?w.issue:w.quickNa}</span></label>)}</div>{inspection[key]!=='unknown'&&<button className="walk-answer-reset" aria-label={`${w.resetCheck}: ${w[key]}`} onClick={()=>changeCheck(key,'unknown')}>{w.reset}</button>}</fieldset>)}
    </div>
    <details className="walk-note-fold" open={checkKeys.some(key=>inspection[key]==='attention')||!!zone.notes?.trim()}><summary>{w.noteToggle}<ChevronDown size={14}/></summary><label className="field walk-notes"><span>{w.notesHint}</span><textarea aria-label={w.notes} rows={2} maxLength={3000} placeholder={w.notesHint} value={zone.notes||''} onChange={e=>onUpdate({notes:e.target.value})}/></label></details>
    <details className="walk-equipment-fold" open={assetsOpen} onToggle={e=>setAssetsOpen(e.currentTarget.open)}><summary><span>{w.equipmentShort}<b>{zone.assets?.length||0}</b></span><ChevronDown size={15}/></summary>
    <section className="walk-assets"><div className="walk-equipment-toolbar">{!editing&&<button className="button subtle small" disabled={(zone.assets?.length||0)>=100} title={(zone.assets?.length||0)>=100?w.maxAssets:undefined} onClick={()=>{setEditing(newAsset());setError('');}}><Plus size={14}/>{w.addAsset}</button>}</div>
      {editing?<form className="asset-editor" onSubmit={e=>{e.preventDefault();saveAsset();}} aria-label={zone.assets?.some(a=>a.id===editing.id)?w.editAsset:w.newAsset}><div className="asset-editor-title"><Tag size={15}/><strong>{zone.assets?.some(a=>a.id===editing.id)?w.editAsset:w.newAsset}</strong><button type="button" className="icon-button" aria-label={w.cancel} onClick={()=>{setEditing(null);setError('');}}><X size={16}/></button></div><div className="asset-form-grid">
        <label className="field"><span>{w.assetLabel} *</span><input id={`${formId}-label`} aria-label={w.assetLabel} required autoFocus maxLength={80} value={editing.label} onChange={e=>setEditing({...editing,label:e.target.value})}/></label>
        <label className="field"><span>{w.model}</span><input aria-label={w.model} maxLength={120} value={editing.model} onChange={e=>setEditing({...editing,model:e.target.value})}/></label>
        <label className="field"><span>{w.type}</span><select aria-label={w.type} value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as Asset['type']})}><option value="OP">ОП</option><option value="OU">ОУ</option></select></label>
        <label className="field"><span>{w.condition}</span><select aria-label={w.condition} value={editing.condition} onChange={e=>setEditing({...editing,condition:e.target.value as Asset['condition']})}>{(['unknown','available','service','unusable'] as const).map(v=><option value={v} key={v}>{w[v]}</option>)}</select></label>
        <label className="field asset-date"><span>{w.nextService}</span><input aria-label={w.nextService} aria-describedby={`${formId}-service-hint`} type="date" min="1900-01-01" max="2199-12-31" value={editing.nextService} onChange={e=>setEditing({...editing,nextService:e.target.value})}/><small id={`${formId}-service-hint`}>{w.serviceHint}</small></label>
      </div>{error&&<p className="field-error" role="alert">{error}</p>}<div className="asset-form-actions"><button className="button subtle small" type="button" onClick={()=>{setEditing(null);setError('');}}><ArrowLeft size={14}/>{w.cancel}</button><button className="button primary small" type="submit"><Check size={14}/>{w.save}</button></div></form>:<>
        {!zone.assets?.length?<div className="asset-empty"><Wrench size={23}/><div><strong>{w.noAssets}</strong><p>{w.noAssetsHint}</p></div></div>:<div className="asset-list">{zone.assets.map(asset=>{const status=serviceStatus(asset,date);return <div className="asset-row" key={asset.id}><button className="asset-open" aria-label={`${w.editAsset}: ${asset.label}`} onClick={()=>{setEditing(structuredClone(asset));setError('');}}><span className={`asset-type ${asset.type.toLowerCase()}`}>{asset.type==='OP'?'ОП':'ОУ'}</span><span><strong>{asset.label}</strong><small>{asset.model||'—'} · {conditionLabel(asset)}</small><span className={`asset-deadline ${status}`}><Clock3 size={12}/>{w[status]}{asset.nextService?` · ${asset.nextService}`:''}</span></span><ChevronRight size={14}/></button><button className="icon-button danger" aria-label={`${w.remove}: ${asset.label}`} onClick={()=>{if(window.confirm(w.removeConfirm))onUpdate({assets:zone.assets!.filter(a=>a.id!==asset.id),inspection:{...inspection,checkedOn:undefined}});}}><Trash2 size={15}/></button></div>;})}</div>}
        <p className="walk-caption">{w.registryHint}</p>{!!zone.assets?.length&&<p className="walk-caption">{w.deadlines}: {date||'—'}. {w.deadlineHint}</p>}
      </>}
    </section></details>
    <div className="walk-record-footer"><div>{visited?<span className="visit-stamp"><CheckCheck size={17}/>{w.finished} · {date}</span>:<span>{!validDate(date)?w.invalidDate:unanswered?`${w.checksLeft}: ${unanswered}`:w.readyToSave}</span>}</div><div className="walk-footer-actions"><button className="button primary" disabled={!validDate(date)||!inspectionReady(inspection)||!!editing||visited&&!onNext} onClick={()=>{if(!visited)onUpdate({inspection:{...inspection,checkedOn:date}});onNext?.();}}><Check size={16}/>{visited?(onNext?w.next:w.finished):onNext?w.saveNext:w.markVisited}<ArrowRight size={15}/></button></div></div>

  </section>;
}
