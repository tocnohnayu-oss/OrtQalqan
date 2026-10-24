import { ArrowLeft, Search } from 'lucide-react';
import type { Building, Language } from '../domain/types';
import { planWords } from '../locales/plan';
import { buildingWords } from '../locales/objects';
import { ObjectSketch } from './ObjectSketch';

export function FocusPlanHeader({building,language,roomsOpen,onRooms,onExit}:{building:Building;language:Language;roomsOpen:boolean;onRooms:()=>void;onExit:()=>void}){
  const p=planWords(language),w=buildingWords(language),name=language==='ru'?building.name:building.nameKk;
  return <header className="plan-focus-bar"><ObjectSketch kind={building.kind||'other'}/><div className="plan-focus-context"><h1 id="plan-focus-heading" tabIndex={-1} title={name}>{name}</h1>{building.demo&&<small>{w.demo}</small>}</div><button className="focus-rooms-toggle icon-button" aria-label={p.focusRooms} title={p.focusRooms} aria-expanded={roomsOpen} aria-controls="plan-room-index" onClick={onRooms}><Search size={19}/></button><button className="button subtle focus-exit" onClick={onExit}><ArrowLeft size={17}/><span>{p.returnToObject}</span></button></header>;
}
