import { useMemo, useState } from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';
import type { Building, Zone, Language } from '../domain/types';
import { simulateScenario } from '../domain/scenarios.mjs';
import { translator, issueKey, type WordKey } from '../locales';
import { SceneIllustration, type Scene } from './Scenes';

type Kind='area'|'electronics'|'materials'|'winter'|'automatic'|'inventory';
const scenarios:{id:Kind;scene:Scene;title:WordKey;description:WordKey;next:WordKey}[]=[
  {id:'area',scene:'classroom',title:'scenarioArea',description:'scenarioAreaBody',next:'scenarioAreaNext'},
  {id:'electronics',scene:'server',title:'scenarioElectronics',description:'scenarioElectronicsBody',next:'scenarioElectronicsNext'},
  {id:'materials',scene:'lab',title:'scenarioMaterials',description:'scenarioMaterialsBody',next:'scenarioMaterialsNext'},
  {id:'winter',scene:'winter',title:'scenarioWinter',description:'scenarioWinterBody',next:'scenarioWinterNext'},
  {id:'automatic',scene:'systems',title:'scenarioAutomatic',description:'scenarioAutomaticBody',next:'scenarioAutomaticNext'},
  {id:'inventory',scene:'inspection',title:'scenarioInventory',description:'scenarioInventoryBody',next:'scenarioInventoryNext'},
];

export function ScenarioExplorer({building,zoneId,language,onApply}:{building:Building;zoneId:string;language:Language;onApply:(patch:Partial<Zone>)=>void}){
  const [kind,setKind]=useState<Kind>('area'),[growth,setGrowth]=useState(50);
  const t=translator(language),zone=building.floors.flatMap(f=>f.zones).find(z=>z.id===zoneId);
  const result=useMemo(()=>simulateScenario(building,zoneId,kind,growth),[building,zoneId,kind,growth]);
  if(!zone||!result)return <p className="muted">{t('selectOrAdd')}</p>;
  const active=scenarios.find(s=>s.id===kind)!,before=result.currentRow!,after=result.proposedRow!;
  const change=Object.entries(result.patch).some(([key,value])=>zone[key as keyof Zone]!==value);
  const delta=after.type&&before.type&&after.type===before.type?after.count-before.count:null;
  return <div className="scenario-explorer">
    <nav className="scenario-menu" aria-label={t('scenarios')}>{scenarios.map((s,i)=><button key={s.id} aria-pressed={kind===s.id} onClick={()=>setKind(s.id)} className={kind===s.id?'active':''}><span>{String(i+1).padStart(2,'0')}</span>{t(s.title)}<ArrowRight size={14}/></button>)}</nav>
    <div className="scenario-stage">
      <div className="scenario-intro"><div><span className="eyebrow">{t('whatIf')}</span><h3>{t(active.title)}</h3><p>{t(active.description)}</p></div><SceneIllustration scene={active.scene}/></div>
      <div className="scenario-zone"><span>{t('selectedZone')}</span><strong>{language==='ru'?zone.name:zone.nameKk}</strong></div>
      {kind==='area'&&<label className="scenario-range"><span>{t('areaGrowth')}<strong>+{growth}%</strong></span><input type="range" min="10" max="200" step="10" value={growth} onChange={e=>setGrowth(Number(e.target.value))}/><small>{zone.area} → {result.patch.area??zone.area} {t('sqm')}</small></label>}
      <div className="scenario-comparison" aria-live="polite"><div><span>{t('currentState')}</span><strong>{before.type?<>{before.count}<small>{before.type==='OP'?'ОП':'ОУ'}</small></>:'—'}</strong><small>{t('available')}: {zone.existing}</small></div><ArrowRight className="comparison-arrow" size={23}/><div className="proposed-state"><span>{t('scenarioState')}</span><strong>{after.type?<>{after.count}<small>{after.type==='OP'?'ОП':'ОУ'}</small></>:<span className="needs-selection">{t('special')}</span>}</strong><small>{t('available')}: {kind==='inventory'?0:zone.existing}</small></div>{delta!==null&&<span className="scenario-delta">Δ {delta>0?'+':''}{delta} {t('unit')}</span>}</div>
      <p className="scenario-scope">{t('scenarioScope')}</p>
      <div className="scenario-next"><ArrowRight size={16}/><div><strong>{t('nextStep')}</strong><p>{t(active.next)}</p></div></div>
      {after.issues.length>0&&<div className="scenario-issues">{after.issues.map(key=><p key={key}><CircleAlert size={14}/>{t(issueKey[key])}</p>)}</div>}
      <div className="scenario-footer"><p>{t('scenarioDraftNote')}</p><button className="button primary" disabled={!change||after.issues.includes('invalidArea')} onClick={()=>onApply(result.patch as Partial<Zone>)}>{t(change?'applyScenario':'scenarioNoChange')}<ArrowRight size={15}/></button></div>
    </div>
  </div>;
}
