import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, CalendarDays, ChevronDown, ClipboardList, Download, MapPin, Search, Tag, X } from 'lucide-react';
import type { Building, Language } from '../domain/types';
import { ATTENTION_GROUPS, attentionItems } from '../domain/attention.mjs';
import { validDate } from '../domain/inspection.mjs';
import { attentionReason, attentionSource, attentionWords } from '../locales/attention.mjs';
import { RoomGlyph } from './RoomGlyph';

function SheetIllustration() {
  return <svg className="attention-illustration" viewBox="0 0 190 126" fill="none" aria-hidden="true">
    <path d="M38 22h97l17 17v72H38V22Z" fill="#fffdf8" stroke="#253b42" strokeWidth="1.6"/>
    <path d="M135 22v18h17M29 42v78h105" stroke="#8c9f93" strokeWidth="1.4"/>
    <path d="M57 49h46M57 55h28M70 72h58M70 89h35" stroke="#71877a" strokeWidth="1.5"/>
    <path d="M56 68h7v7h-7zM56 85h7v7h-7z" stroke="#b5452b" strokeWidth="1.6"/>
    <path d="m112 15 12-8 13 9v12h-25V15Z" fill="#253b42"/>
    <path d="m119 18 4 4 8-9" stroke="#fffdf8" strokeWidth="1.6"/>
    <path d="M137 65h39v38h-39V65Z" fill="#f2dfcd" stroke="#b5452b" strokeWidth="1.5"/>
    <path d="M137 76h39M147 61v8M166 61v8M147 84h5M160 84h6M147 93h5" stroke="#b5452b" strokeWidth="1.6"/>
    <path d="M18 111h145M47 15h43" stroke="#a6b5a6" strokeWidth="1.2"/>
  </svg>;
}

const normalize = (value:string) => value.normalize('NFKC').toLowerCase().replaceAll('ё','е').replace(/[‐‑‒–—]/g,'-');
type Props = {active:boolean;initialZoneId?:string;preferModel?:boolean;building:Building;language:Language;onOpen:(zoneId:string,assetId?:string)=>void;onLocate:(zoneId:string)=>void;onRooms:()=>void;onExport:()=>void};

export function AttentionSheet({active,initialZoneId='',preferModel=false,building,language,onOpen,onLocate,onRooms,onExport}:Props) {
  const w=attentionWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const [query,setQuery]=useState(''),[group,setGroup]=useState('all'),[limit,setLimit]=useState(40),[zoneScope,setZoneScope]=useState(initialZoneId);
  const descriptionId=useId(),items=attentionItems(building);
  const root=useRef<HTMLElement>(null),lastOpened=useRef('');
  useLayoutEffect(()=>{if(!active)return;const frame=requestAnimationFrame(()=>{
    const row=Array.from(root.current?.querySelectorAll<HTMLElement>('[data-attention-id]')||[]).find(node=>node.dataset.attentionId===lastOpened.current);
    const target=row?.querySelector<HTMLButtonElement>('.attention-open')||root.current?.querySelector<HTMLElement>('h3');
    target?.focus({preventScroll:true});if(row)row.scrollIntoView({block:'center'});else root.current?.closest('dialog')?.scrollTo({top:0});
  });return()=>cancelAnimationFrame(frame);},[active]);
  const scope=building.floors.flatMap(floor=>floor.zones.map(zone=>({floor,zone}))).find(entry=>entry.zone.id===zoneScope);
  const scopedItems=scope?items.filter(item=>item.zone.id===scope.zone.id):items;
  const tokens=normalize(query).trim().split(/\s+/u).filter(Boolean);
  const matches=scopedItems.filter(item => (group==='all'||item.group===group)&&tokens.every(token=>normalize([
    item.floor.name,item.floor.nameKk,item.zone.name,item.zone.nameKk,item.asset?.label||'',item.asset?.model||'',
    item.kind==='room'?item.zone.notes||'':'',...item.reasons.map(reason=>attentionReason(item,reason,language)),
  ].join(' ')).includes(token)));
  const shown=matches.slice(0,limit);
  const clear=()=>{setQuery('');setGroup('all');setLimit(40);setZoneScope('');};
  return <section className="attention-sheet" ref={root} aria-label={w.title}>
    <button className="attention-return" onClick={onRooms}><ArrowLeft size={15}/>{w.rooms}</button>
    <header className="attention-cover"><div><span className="eyebrow">{building.demo?w.demo:w.eyebrow}</span><h3 tabIndex={-1}>{w.heading}</h3><p>{w.intro}</p></div><SheetIllustration/></header>
    {scope&&<div className="attention-room-scope"><MapPin size={19}/><div><small>{w.roomScope}</small><strong>{name(scope.zone)}</strong><span>{name(scope.floor)}</span></div><button aria-label={w.wholeObject} title={w.wholeObject} onClick={()=>{setZoneScope('');setLimit(40);}}><X size={18}/></button></div>}
    <div className="attention-reference"><span><CalendarDays size={16} aria-hidden="true"/>{w.referenceDate}: <strong>{validDate(building.date)?building.date:'—'}</strong></span><small>{validDate(building.date)?w.referenceHint:w.invalidDate}</small></div>
    {!items.length?<div className="attention-empty"><ClipboardList size={34} aria-hidden="true"/><h4>{w.empty}</h4><p>{w.emptyHint}</p><button className="button subtle" onClick={onRooms}>{w.start}<ArrowRight size={15}/></button></div>:<>
      <div className="attention-tools"><label className="attention-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label={w.search} placeholder={w.searchHint} value={query} onChange={e=>{setQuery(e.target.value);setLimit(40);}} onKeyDown={e=>{if(e.key==='Escape'&&query){e.preventDefault();e.stopPropagation();setQuery('');setLimit(40);}}}/>{query&&<button aria-label={w.clear} onClick={()=>{setQuery('');setLimit(40);}}><X size={16}/></button>}</label><label className="attention-scope"><select aria-label={w.scope} value={group} onChange={e=>{setGroup(e.target.value);setLimit(40);}}><option value="all">{w.all} · {scopedItems.length}</option>{ATTENTION_GROUPS.map(key=><option value={key} key={key}>{w[key as keyof typeof w]} · {scopedItems.filter(item=>item.group===key).length}</option>)}</select><ChevronDown size={15} aria-hidden="true"/></label></div>
      <div className="attention-list-status" role="status">{w.shown}: {shown.length} / {matches.length}</div>
      <div className="attention-groups">{ATTENTION_GROUPS.map(key=>{
        const entries=shown.filter(item=>item.group===key);if(!entries.length)return null;
        return <section className={`attention-group attention-${key}`} key={key} aria-label={w[key as keyof typeof w]}>
          <header><span className="attention-group-index" aria-hidden="true">{String(ATTENTION_GROUPS.indexOf(key)+1).padStart(2,'0')}</span><div><h4>{w[key as keyof typeof w]} <span>{matches.filter(item=>item.group===key).length}</span></h4><p>{w[`${key}Hint` as keyof typeof w]}</p></div></header>
          <ol>{entries.map(item=>{
            const room=item.floor.layout?.rooms.find(room=>room.zoneId===item.zone.id),placed=!!room||!!item.floor.plan&&item.floor.markers.some(marker=>marker.zoneId===item.zone.id);
            const inModel=preferModel&&!!room,locateLabel=inModel?w.locateModel:w.locate;
            const identity=item.asset?`${item.asset.label} · ${name(item.zone)}`:name(item.zone);
            return <li className="attention-row" data-attention-id={item.id} key={item.id}>
              <div className="attention-row-symbol" aria-hidden="true">{item.asset?<Tag size={22}/>:<RoomGlyph preset={room?.preset} placed={!!room}/>}</div>
              <div className="attention-row-body"><span className="attention-location">{name(item.floor)}<i>/</i>{item.kind==='asset'?name(item.zone):w.observation}</span><h5>{item.asset?<><span className={`attention-asset-type ${item.asset.type.toLowerCase()}`}>{item.asset.type==='OP'?'ОП':'ОУ'}</span>{item.asset.label}</>:name(item.zone)}</h5>
                {item.asset?.model&&<span className="attention-model">{item.asset.model}</span>}
                <ul className="attention-reasons">{item.reasons.map(reason=><li key={reason}>{attentionReason(item,reason,language)}</li>)}</ul>
                {item.kind==='room'&&item.zone.notes?.trim()&&<p className="attention-note">{item.zone.notes}</p>}
                <small className="attention-source">{attentionSource(item,building.date,language)}</small>
                <div className="attention-row-actions"><button className="attention-open" aria-label={`${item.asset?w.openAsset:w.openRoom}: ${identity} · ${name(item.floor)}`} onClick={()=>{lastOpened.current=item.id;onOpen(item.zone.id,item.asset?.id);}}>{w.open}<ArrowRight size={14}/></button>{placed&&<button className="attention-locate" aria-label={`${locateLabel}: ${name(item.zone)} · ${name(item.floor)}`} onClick={()=>onLocate(item.zone.id)}>{inModel?<Box size={14}/>:<MapPin size={14}/>} {locateLabel}</button>}</div>
              </div>
            </li>;
          })}</ol>
        </section>;
      })}</div>
      {!matches.length&&<div className="attention-empty attention-no-match"><Search size={28} aria-hidden="true"/><h4>{scope&&!query&&!scopedItems.length?w.scopeEmpty:w.noMatch}</h4><p>{scope&&!query&&!scopedItems.length?w.scopeEmptyHint:w.noMatchHint}</p><button className="text-button" onClick={clear}>{w.clear}</button></div>}
      {shown.length<matches.length&&<button className="button subtle attention-more" onClick={()=>setLimit(value=>value+40)}>{w.limit}<ChevronDown size={15}/></button>}
      <footer className="attention-export"><div><button className="button subtle" aria-describedby={descriptionId} onClick={onExport}><Download size={16}/>{w.export}</button><small id={descriptionId}>{w.exportHint}</small></div><p>{w.boundary}</p></footer>
    </>}
  </section>;
}
