import { ArrowUpRight, CircleAlert, RefreshCw } from 'lucide-react';
import type { CalculationRow, Language, Zone } from '../domain/types';
import { translator } from '../locales';
import { inspectorWords } from '../locales/inspector';
import { EquipmentIllustration } from './Illustrations';

export function RoomCalculation({zone,row,stale,language,onRefresh,onDetails,onExisting}:{zone:Zone;row?:CalculationRow;stale:boolean;language:Language;onRefresh:()=>void;onDetails:()=>void;onExisting:(count:number)=>void}){
  const t=translator(language),w=inspectorWords(language);
  return <div className="simple-zone-result room-calculation">
    {stale?<div className="room-result-stale"><RefreshCw size={19}/><p>{t('stale')}</p><button className="button subtle small" title={w.refreshHint} onClick={onRefresh}>{w.refresh}</button></div>:row?.type?<>
      <span className="room-result-caption">{w.result}</span>
      <div className="room-result-equipment"><EquipmentIllustration type={row.type}/><div><span>{row.type==='OP'?'ОП · 4 кг':'ОУ'}</span><strong>{row.count}<small>{t('unit')}</small></strong></div></div>
      <button className="room-proof-trigger" onClick={onDetails}><span>{w.reason}{row.issues.length>0&&<small>{row.issues.length} {t('issues')}</small>}</span><ArrowUpRight size={16}/></button>
    </>:<div className="room-result-manual"><CircleAlert size={20}/><strong>{t('special')}</strong><button className="text-button" onClick={onDetails}>{w.reason}<ArrowUpRight size={14}/></button></div>}
    <div className="room-inventory-entry"><label className="field"><span>{t('existing')}</span><input aria-label={t('existing')} type="number" min="0" step="1" value={zone.existing} onChange={event=>onExisting(Math.max(0,Math.floor(Number(event.target.value)||0)))}/></label>{!stale&&row?.type&&<div className="room-inventory-gap"><span>{t('shortage')}</span><strong>{Math.max(0,row.count-zone.existing)}</strong></div>}</div>
  </div>;
}
