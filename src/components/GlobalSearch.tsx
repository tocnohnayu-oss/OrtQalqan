import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, ClipboardCheck, FileDown, Layers3, RotateCcw, Search, Tag } from 'lucide-react';
import type { Asset, Building, Floor, Language, Zone } from '../domain/types';
import { findRooms } from '../domain/room-search.mjs';
import { atlasWords } from '../locales/atlas';
import { RoomGlyph } from './RoomGlyph';

type Props={building:Building;language:Language;onSelect:(zoneId:string,floorId:string,assetId?:string)=>void;onAction:(action:'atlas'|'walk'|'calculate'|'pdf')=>void};
export function GlobalSearch({building,language,onSelect,onAction}:Props) {
  const w=atlasWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const [query,setQuery]=useState(''),[active,setActive]=useState(0),input=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null),id=useId();
  type Match={floor:Floor;zone:Zone;matchedAssets:Asset[];asset?:Asset};
  const matches=findRooms(building,query).flatMap<Match>(entry=>entry.matchedAssets.length?entry.matchedAssets.map(asset=>({...entry,asset})): [{...entry,asset:undefined}]);
  const actions=query.trim()?[]:[{key:'atlas' as const,label:w.title,icon:Layers3},{key:'walk' as const,label:w.resume,icon:ClipboardCheck},{key:'calculate' as const,label:w.update,icon:RotateCcw},{key:'pdf' as const,label:'PDF',icon:FileDown}];
  const rows=matches.slice(0,query.trim()?40:8),count=actions.length+rows.length;
  const open=(index:number)=>{if(index<actions.length){onAction(actions[index].key);return;}const entry=rows[index-actions.length];if(entry)onSelect(entry.zone.id,entry.floor.id,entry.asset?.id);};
  useEffect(()=>{input.current?.focus();},[]);
  useEffect(()=>{document.getElementById(`${id}-${active}`)?.scrollIntoView({block:'nearest'});},[active,id,query]);
  return <div className="global-search" onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setActive(value=>count?(value+(event.key==='ArrowDown'?1:-1)+count)%count:0);input.current?.focus({preventScroll:true});}else if(event.key==='Enter'&&event.target===input.current){event.preventDefault();open(active);}}}>
    <label className="global-search-input"><Search size={22}/><input ref={input} type="search" role="combobox" aria-label={w.searchLabel} aria-controls={`${id}-list`} aria-expanded="true" aria-autocomplete="list" aria-activedescendant={count?`${id}-${active}`:undefined} value={query} onChange={event=>{setQuery(event.target.value);setActive(0);}} placeholder={w.searchHint}/><kbd>Esc</kbd></label>
    <p className="global-search-context">{w.context}<span>{name(building)}</span></p>
    <div className="global-search-results" role="listbox" aria-label={w.results} id={`${id}-list`} ref={list}>
      {actions.map((action,index)=><button role="option" aria-selected={active===index} id={`${id}-${index}`} key={action.key} onMouseMove={()=>setActive(index)} onClick={()=>open(index)}><action.icon size={20}/><span>{action.label}<small>{w.actions}</small></span><ArrowRight size={15}/></button>)}
      {rows.map((entry,index)=>{const position=index+actions.length,room=entry.floor.layout?.rooms.find(room=>room.zoneId===entry.zone.id);return <button role="option" aria-selected={active===position} id={`${id}-${position}`} key={`${entry.zone.id}:${entry.asset?.id||''}`} onMouseMove={()=>setActive(position)} onClick={()=>open(position)} aria-label={`${entry.asset?w.openAsset:w.openRoom}: ${entry.asset?entry.asset.label+' · ':''}${name(entry.zone)} · ${name(entry.floor)}`}>
        {entry.asset?<Tag size={22}/>:<RoomGlyph preset={room?.preset} placed={!!room}/>}<span><strong>{entry.asset?.label||name(entry.zone)}</strong><small>{name(entry.floor)} · {entry.asset?name(entry.zone):room?w.drawing:w.unmapped}</small>{entry.asset?.model&&<small>{entry.asset.model}</small>}</span><ArrowRight size={15}/></button>;})}
      {!count&&<div className="global-search-empty"><Search size={28}/><strong>{w.noMatches}</strong><p>{w.noMatchesHint}</p></div>}
    </div>
    <footer><span>{matches.length>40&&query.trim()?w.limit:w.keyboard}</span><span>{count}</span></footer>
  </div>;
}
