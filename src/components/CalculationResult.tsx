import { ArrowRight, BookOpen, CircleAlert, FileDown, Info, Pencil } from 'lucide-react';
import type { Language, Snapshot } from '../domain/types';
import { translator, issueKey } from '../locales';
import { proofWords } from '../locales/proof';
import { EquipmentIllustration } from './Illustrations';
import { polygonArea } from '../domain/layout.mjs';

export function CalculationResult({snapshot,language,onSources,onReport,onEditZone,canEdit}:{snapshot:Snapshot;language:Language;onSources:()=>void;onReport:()=>void;onEditZone:(id:string)=>void;canEdit:boolean}){
  const w=proofWords(language),t=translator(language),supported=snapshot.rows.filter(row=>row.type).length;
  const name=(value:{name:string;nameKk:string})=>language==='ru'?value.name:value.nameKk;
  return <div className="calculation-proof">
    <div className="proof-object"><span>{w.object}</span><h3>{name(snapshot.building)}</h3></div>
    <div className="proof-totals">{(['OP','OU'] as const).map(type=><section key={type} aria-label={type==='OP'?'ОП':'ОУ'}><EquipmentIllustration type={type}/><div><span>{type==='OP'?w.powder:w.co2}</span><strong>{supported?(type==='OP'?snapshot.totalOP:snapshot.totalOU):'—'}<small>{type==='OP'?'ОП':'ОУ'}</small></strong></div></section>)}</div>
    <div className="proof-scope"><Info size={19}/><div><strong>{w.scope}</strong><p>{w.scopeHint}</p><button className="text-button" onClick={onSources}><BookOpen size={14}/>{w.sources}<ArrowRight size={14}/></button></div></div>
    <div className="proof-coverage"><span>{w.supported}: <strong>{supported} {w.of} {snapshot.rows.length}</strong></span>{snapshot.rows.length>supported&&<span><CircleAlert size={14}/>{w.unsupported}: {snapshot.rows.length-supported}</span>}</div>
    {snapshot.building.floors.map(floor=><section className="proof-floor" key={floor.id}><h3>{name(floor)}</h3>{floor.zones.map(zone=>{
      const row=snapshot.rows.find(item=>item.zoneId===zone.id)!;
      const room=floor.layout?.rooms.find(item=>item.zoneId===zone.id),drawnArea=room?polygonArea(room.points):null;
      return <article className={`proof-zone ${row.type?'':'unsupported'}`} key={zone.id}><div className="proof-zone-heading"><h4>{name(zone)}</h4><div className="proof-zone-actions"><span>{zone.hazard==='special'?'—':zone.hazard}</span><button className="proof-edit-zone" aria-label={`${w.editLabel}: ${name(zone)}`} disabled={!canEdit} onClick={()=>onEditZone(zone.id)}><Pencil size={14}/>{w.edit}</button></div></div>{row.type?<><span className="proof-rounding">{w.round}</span><div className="proof-equation" role="group" aria-label={`${w.round}: ${row.area} / ${row.rate} = ${row.count}`}><span><strong>{row.area}</strong><small>{t('sqm')}</small></span><b aria-hidden="true">÷</b><span><strong>{row.rate}</strong><small>{w.perUnit}</small></span><b aria-hidden="true">→</b><span className="proof-answer"><strong>{row.count}</strong><small>{row.type==='OP'?'ОП':'ОУ'}</small></span></div>{drawnArea!==null&&Math.abs(drawnArea-row.area)>1e-8&&<p className="proof-area-note">{language==='ru'?`На чертеже: ${drawnArea} м². Для расчёта использовано введённое значение: ${row.area} м².`:`Сызбада: ${drawnArea} м². Есептеуге енгізілген мән қолданылды: ${row.area} м².`}</p>}<p className="proof-inventory">{w.available}: {zone.existing}<i>·</i>{w.difference}: {Math.max(0,row.count-zone.existing)}</p></>:<p className="proof-manual"><CircleAlert size={17}/>{w.manual}</p>}{row.issues.length>0&&<ul className="proof-issues">{row.issues.map(key=><li key={key}>{t(issueKey[key])}</li>)}</ul>}</article>;
    })}{snapshot.floorExtras.filter(item=>item.floorId===floor.id).map((item,index)=><p className="proof-floor-extra" key={index}>{w.floorExtra}: +{item.count} {item.type==='OP'?'ОП':'ОУ'}</p>)}</section>)}
    <div className="proof-footer"><p>{w.snapshot}</p><button className="button primary wide" onClick={onReport}><FileDown size={17}/>{w.pdf}<ArrowRight size={16}/></button></div>
  </div>;
}
