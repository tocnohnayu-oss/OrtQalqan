import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, Box, ClipboardCheck, FileDown, Layers3, MapPin, RotateCcw, Search, Tag, X } from 'lucide-react';
import type { Asset, Building, Floor, Language, Zone } from '../domain/types';
import { findRooms } from '../domain/room-search.mjs';
import { atlasWords } from '../locales/atlas';
import { RoomGlyph } from './RoomGlyph';

type Props={building:Building;language:Language;preferModel:boolean;onSelect:(zoneId:string,floorId:string,assetId?:string)=>void;onLocate:(zoneId:string)=>void;onAction:(action:'atlas'|'walk'|'calculate'|'pdf')=>void;onClose:()=>void};
export function GlobalSearch({building,language,preferModel,onSelect,onLocate,onAction,onClose}:Props) {
  const w=atlasWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const [query,setQuery]=useState(''),[limit,setLimit]=useState(40),input=useRef<HTMLInputElement>(null),root=useRef<HTMLDivElement>(null),pendingMore=useRef<number|null>(null),id=useId();
  type Match={floor:Floor;zone:Zone;matchedAssets:Asset[];asset?:Asset};
  const matches=useMemo(()=>findRooms(building,query).flatMap<Match>(entry=>entry.matchedAssets.length?entry.matchedAssets.map(asset=>({...entry,asset})): [{...entry,asset:undefined}]),[building,query]);
  const actions=query.trim()?[]:[{key:'atlas' as const,label:w.title,icon:Layers3},{key:'walk' as const,label:w.resume,icon:ClipboardCheck},{key:'calculate' as const,label:w.update,icon:RotateCcw},{key:'pdf' as const,label:'PDF',icon:FileDown}];
  const rows=matches.slice(0,query.trim()?limit:8),count=actions.length+rows.length;
  const open=(index:number)=>{if(index<actions.length){onAction(actions[index].key);return;}const entry=rows[index-actions.length];if(entry)onSelect(entry.zone.id,entry.floor.id,entry.asset?.id);};
  useEffect(()=>{input.current?.focus();},[]);
  useEffect(()=>{if(pendingMore.current===null)return;const index=pendingMore.current;pendingMore.current=null;root.current?.querySelector<HTMLButtonElement>(`[data-search-primary="${index}"]`)?.focus();},[limit]);
  const step=(direction:number)=>{
    const focused=document.activeElement instanceof HTMLElement?document.activeElement.closest<HTMLElement>('[data-search-index]'):null;
    const current=focused?Number(focused.dataset.searchIndex):-1,next=current<0?(direction>0?0:count-1):(current+direction+count)%count;
    if(!count)return;root.current?.querySelector<HTMLButtonElement>(`[data-search-primary="${next}"]`)?.focus();
  };
  return <div className="global-search spatial-search" ref={root} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();step(event.key==='ArrowDown'?1:-1);}else if(event.key==='Enter'&&event.target===input.current){event.preventDefault();open(0);}}}>
    <div className="global-search-input"><Search size={22}/><input ref={input} type="search" maxLength={120} aria-label={w.searchLabel} aria-controls={`${id}-list`} aria-describedby={`${id}-context`} value={query} onChange={event=>{setQuery(event.target.value);setLimit(40);pendingMore.current=null;}} placeholder={w.searchHint}/>{query?<button className="global-search-clear" aria-label={w.clearSearch} onClick={()=>{setQuery('');setLimit(40);pendingMore.current=null;input.current?.focus();}}><X size={18}/></button>:<kbd>Esc</kbd>}</div>
    <p className="global-search-context" id={`${id}-context`}>{w.context}<span>{name(building)}{building.demo&&<small className="global-search-demo">{w.demo}</small>}</span></p>
    <div className="search-choice-hint"><span>{w.sourceChoice}</span><span>{w.locationChoice}</span></div>
    <div className="global-search-results" role="region" aria-label={w.results} id={`${id}-list`}>
      <ul className="global-search-list">
      {actions.map((action,index)=><li className="global-search-row is-action" key={action.key}><button className="global-search-action" data-search-index={index} data-search-primary={index} onClick={()=>open(index)}><action.icon size={20}/><span>{action.label}<small>{w.actions}</small></span><ArrowRight size={15}/></button></li>)}
      {rows.map((entry,index)=>{const position=index+actions.length,room=entry.floor.layout?.rooms.find(room=>room.zoneId===entry.zone.id),marked=!!entry.floor.plan&&entry.floor.markers.some(marker=>marker.zoneId===entry.zone.id),inModel=preferModel&&!!room,placed=!!room||marked,locateLabel=inModel?w.locateModel:w.locatePlan;return <li className="global-search-row" data-search-room={entry.zone.id} data-search-asset={entry.asset?.id} key={`${entry.zone.id}:${entry.asset?.id||''}`}>
        <button className="global-search-open" data-search-index={position} data-search-primary={position} onClick={()=>open(position)} aria-label={`${entry.asset?w.openAsset:w.openRoom}: ${entry.asset?entry.asset.label+' · ':''}${name(entry.zone)} · ${name(entry.floor)}`}>
        {entry.asset?<Tag size={22}/>:<RoomGlyph preset={room?.preset} placed={!!room} marked={marked}/>}<span><strong>{entry.asset?.label||name(entry.zone)}</strong><small>{name(entry.floor)} · {entry.asset?name(entry.zone):room?w.drawing:marked?w.image:w.unmapped}</small>{entry.asset?.model&&<small>{entry.asset.model}</small>}<span className="global-search-source-label">{entry.asset?w.openAsset:w.openRoom}<ArrowRight size={13}/></span></span></button>
        {placed&&<button className="global-search-locate" data-search-index={position} onClick={()=>onLocate(entry.zone.id)} aria-label={`${locateLabel}: ${name(entry.zone)} · ${name(entry.floor)}${entry.asset?' · '+entry.asset.label:''}`} aria-describedby={entry.asset?`${id}-asset-hint`:undefined}>{inModel?<Box size={17}/>:<MapPin size={17}/>}<span>{inModel?w.locateModelShort:w.locatePlanShort}</span></button>}
      </li>;})}
      </ul>
      {!!query.trim()&&rows.length<matches.length&&<button className="global-search-more" onClick={()=>{pendingMore.current=actions.length+rows.length;setLimit(value=>value+40);}}>{w.searchMore}<span>{rows.length} / {matches.length}</span><ArrowRight size={15}/></button>}
      {!count&&<div className="global-search-empty"><Search size={28}/><strong>{w.noMatches}</strong><p>{w.noMatchesHint}</p></div>}
    </div>
    {rows.some(entry=>entry.asset)&&<p className="global-search-asset-hint" id={`${id}-asset-hint`}>{w.assetLocationHint}</p>}
    <footer><span>{matches.length>rows.length&&query.trim()?w.limit:w.keyboard}</span><span role="status">{w.results}: {rows.length} / {matches.length}</span></footer>
  </div>;
}
