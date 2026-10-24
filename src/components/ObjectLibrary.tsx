import { ArrowRight, Building2, Check, HardDrive, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Building, BuildingKind, Language } from '../domain/types';
import { kindNames } from '../data/templates';
import { buildingWords } from '../locales/objects';
import { ObjectIllustration } from './ObjectIllustration';

export function ObjectLibrary({objects,activeId,language,onOpen,onCreate,onRemove}:{objects:Building[];activeId:string;language:Language;onOpen:(b:Building)=>void;onCreate:(kind:BuildingKind)=>void;onRemove:(id:string)=>void}) {
  const w=buildingWords(language), [kind,setKind]=useState<BuildingKind>('office');
  const name=(b:Building)=>language==='ru'?b.name:b.nameKk;
  return <div className="object-library">
    <div className="library-intro"><div><span className="eyebrow">{w.eyebrow}</span><h3>{w.heading}</h3><p>{w.intro}</p></div><span className="library-serial">OQ<br/><small>ATLAS / 01</small></span></div>
    <section className="library-saved"><div className="library-section-heading"><h4>{w.yourObjects}</h4><span>{String(objects.length).padStart(2,'0')}</span></div>{objects.map(b=><div className="library-object" key={b.id}><button className="library-object-open" onClick={()=>onOpen(b)}><ObjectIllustration kind={b.kind}/><span><strong>{name(b)}</strong><small>{b.demo?w.demo:w.own} · {b.floors.length} {language==='ru'?'эт.':'қаб.'}</small></span>{b.id===activeId?<span className="library-current"><Check size={12}/>{w.current}</span>:<ArrowRight size={17}/>}</button>{b.id!==activeId&&<button className="icon-button danger" aria-label={`${w.remove}: ${name(b)}`} onClick={()=>{if(window.confirm(w.removeConfirm))onRemove(b.id);}}><Trash2 size={15}/></button>}</div>)}</section>
    <section className="library-create"><div className="library-section-heading"><h4>{w.choose}</h4><Plus size={15}/></div><div className="library-template"><div className="library-kind-list">{(Object.keys(kindNames[language]) as BuildingKind[]).map(k=><button key={k} className={kind===k?'active':''} aria-pressed={kind===k} onClick={()=>setKind(k)}><span>{kindNames[language][k]}</span><ArrowRight size={14}/></button>)}</div><div className="library-template-preview"><ObjectIllustration kind={kind}/><div><span className="eyebrow">{w.newObject}</span><h4>{kindNames[language][kind]}</h4><p>{w[`${kind}Hint`]}</p></div><button className="button primary" disabled={objects.length>=20} onClick={()=>onCreate(kind)}><Building2 size={16}/>{w.template}<ArrowRight size={15}/></button></div></div><p className="walk-caption">{objects.length>=20?w.limit:w.chooseHint}</p></section>
    <p className="library-local"><HardDrive size={14}/>{w.local}</p>
  </div>;
}
