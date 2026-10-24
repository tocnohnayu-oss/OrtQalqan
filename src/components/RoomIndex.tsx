import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Plus, Search, Tag, X } from 'lucide-react';
import type { Building, Language } from '../domain/types';
import { findRooms } from '../domain/room-search.mjs';
import { roomWords } from '../locales/rooms';
import { planWords } from '../locales/plan';

export function RoomIndex({building,floorId,selected,language,onSelect,onAdd}:{building:Building;floorId:string;selected:string;language:Language;onSelect:(zoneId:string,floorId:string,assetId?:string)=>void;onAdd:()=>void}){
  const [query,setQuery]=useState(''),[limit,setLimit]=useState(30),input=useRef<HTMLInputElement>(null),hintId=useId(),resultsId=useId();
  const w=roomWords(language),p=planWords(language),name=(item:{name:string;nameKk:string})=>language==='ru'?item.name:item.nameKk;
  const floor=building.floors.find(item=>item.id===floorId)||building.floors[0],searching=!!query.trim(),results=searching?findRooms(building,query):[];
  const clear=()=>{setQuery('');setLimit(30);input.current?.focus();};
  return <div className={`room-index ${searching?'is-searching':''}`}>
    <div className="room-index-search"><Search size={15} aria-hidden="true"/><input ref={input} type="search" maxLength={120} aria-label={w.search} aria-describedby={hintId} aria-controls={resultsId} placeholder={w.placeholder} value={query} onChange={event=>{setQuery(event.target.value);setLimit(30);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();clear();}}}/>{query&&<button type="button" aria-label={w.clear} onClick={clear}><X size={15}/></button>}</div>
    <small className="room-index-scope" id={hintId}>{w.scope}</small>
    {searching?<div className="room-index-results" id={resultsId} aria-label={w.search} role="region"><p className="room-index-found" role="status">{w.found}: <strong>{results.length}</strong></p>{results.length?<><div className="room-index-matches">{building.floors.map(item=>{const matches=results.slice(0,limit).filter(result=>result.floor.id===item.id);return matches.length?<section key={item.id}><h3>{name(item)}</h3>{matches.map(({zone,matchedAssets})=>{
      const asset=matchedAssets[0],placed=item.layout?.rooms.some(room=>room.zoneId===zone.id),marked=item.markers.some(marker=>marker.zoneId===zone.id);
      return <button className="room-index-match" key={zone.id} aria-label={`${asset?w.openAsset+': '+asset.label+' · ':w.openRoom+': '}${name(zone)} · ${name(item)}`} onClick={()=>{setQuery('');input.current?.focus({preventScroll:true});onSelect(zone.id,item.id,asset?.id);}}><span className={`room-index-marker ${asset?'asset':placed?'placed':''}`}>{asset?<Tag size={15}/>:<span/>}</span><span><strong>{name(zone)}</strong>{asset?<small><b>{asset.label}</b>{matchedAssets.length>1?` +${matchedAssets.length-1}`:''}</small>:!placed&&<small>{marked?w.marked:w.unplaced}</small>}</span><ArrowUpRight size={15}/></button>;
    })}</section>:null;})}</div>{results.length>limit&&<button className="room-index-more" onClick={()=>setLimit(value=>value+30)}>{w.more} · {Math.min(limit,results.length)} / {results.length}</button>}</>:<div className="room-index-empty"><Search size={27}/><strong>{w.empty}</strong><p>{w.emptyHint}</p><button className="text-button" onClick={clear}>{w.clear}</button></div>}</div>:<><div className="studio-zone-caption">{p.rooms}</div><div className="studio-zone-list" id={resultsId} aria-label={p.roomList}>{floor.zones.map(zone=><button key={zone.id} className={selected===zone.id?'active':''} onClick={()=>onSelect(zone.id,floor.id)}><span className={floor.layout?.rooms.some(room=>room.zoneId===zone.id)?'placed':''}/>{name(zone)}</button>)}<button className="studio-add-zone" onClick={onAdd}><Plus size={13}/>{p.addZone}</button></div></>}
  </div>;
}
