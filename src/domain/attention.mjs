import { CHECK_KEYS, csvCell, serviceStatus, validDate } from './inspection.mjs';
import { attentionWords, attentionReason, attentionSource } from '../locales/attention.mjs';

export const ATTENTION_GROUPS = ['recorded', 'overdue', 'soon', 'verify'];

/** A live index of saved observations, never a compliance verdict or a second task database.
 * @param {import('./types').Building} building
 */
export function attentionItems(building) {
  const items = building.floors.flatMap(floor => floor.zones.flatMap(zone => {
    const reasons = CHECK_KEYS.filter(key => zone.inspection?.[key] === 'attention');
    if (zone.notes?.trim()) reasons.push('note');
    const room = reasons.length ? [{id:`room:${zone.id}`, kind:'room', group:'recorded', floor, zone, asset:undefined, reasons}] : [];
    const assets = (zone.assets || []).flatMap(asset => {
      const reasons = [];
      if (['service', 'unusable'].includes(asset.condition)) reasons.push(asset.condition);
      if (asset.condition === 'unknown') reasons.push('unverified');
      const status = serviceStatus(asset, building.date);
      if (status === 'overdue' || status === 'soon') reasons.push(status);
      if (!validDate(asset.nextService)) reasons.push('undated');
      if (!reasons.length) return [];
      const group = reasons.some(reason => ['service','unusable'].includes(reason)) ? 'recorded'
        : reasons.includes('overdue') ? 'overdue' : reasons.includes('soon') ? 'soon' : 'verify';
      return [{id:`asset:${asset.id}`, kind:'asset', group, floor, zone, asset, reasons}];
    });
    return [...room, ...assets];
  }));
  // Stable inside each source group; equipment deadlines sort oldest first.
  return items.sort((a,b) => ATTENTION_GROUPS.indexOf(a.group) - ATTENTION_GROUPS.indexOf(b.group)
    || (['overdue','soon'].includes(a.group) ? (a.asset?.nextService || '').localeCompare(b.asset?.nextService || '') : 0));
}

/** Export the complete open object, independently of temporary UI filters. */
export function attentionCSV(building, language) {
  const w = attentionWords(language), name = item => language === 'kk' ? item.nameKk : item.name;
  const header = [w.object,w.floor,w.room,w.record,w.asset,w.model,w.group,w.reason,w.notes,w.serviceDate,w.source,w.referenceDate,w.revision,w.dataStatus];
  const rows = attentionItems(building).map(item => [
    name(building),name(item.floor),name(item.zone),item.kind === 'room' ? w.observation : w.equipment,
    item.asset?.label || '',item.asset?.model || '',w[item.group],item.reasons.map(reason => attentionReason(item,reason,language)).join(' · '),
    item.kind === 'room' ? item.zone.notes || '' : '',item.asset?.nextService || '',attentionSource(item,building.date,language),
    building.date,building.revision,building.demo ? w.demo : w.working,
  ]);
  return '\uFEFF' + [header,...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
