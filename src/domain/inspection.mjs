/** Field records, not a normative compliance assessment. All deadlines are entered by the inspector. */
export const CHECK_KEYS = ['access', 'marking', 'passport'];
export const CHECK_ANSWERS = ['unknown', 'ok', 'attention', 'na'];
export const ASSET_CONDITIONS = ['unknown', 'available', 'service', 'unusable'];
export const EMPTY_INSPECTION = { access: 'unknown', marking: 'unknown', passport: 'unknown' };

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2199-12-31') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function inspectionReady(inspection) {
  return CHECK_KEYS.every(key => ['ok', 'attention', 'na'].includes(inspection?.[key]));
}

export function inspectionStatus(zone, date) {
  const inspection = zone.inspection;
  if (validDate(date) && inspection?.checkedOn === date && inspectionReady(inspection)) return 'visited';
  return CHECK_KEYS.some(key => inspection?.[key] && inspection[key] !== 'unknown') ? 'started' : 'pending';
}

export function serviceStatus(asset, date) {
  if (!validDate(date) || !validDate(asset.nextService)) return 'undated';
  const days = Math.round((Date.parse(`${asset.nextService}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000);
  // 30 days is a planning window, not a regulatory service interval.
  return days < 0 ? 'overdue' : days <= 30 ? 'soon' : 'scheduled';
}

export function needsAttention(zone, date) {
  return CHECK_KEYS.some(key => zone.inspection?.[key] === 'attention') || (zone.assets || []).some(asset => asset.condition !== 'available' || serviceStatus(asset, date) === 'overdue' || serviceStatus(asset, date) === 'soon');
}

export function inspectionSummary(building) {
  const zones = building.floors.flatMap(f => f.zones);
  return {
    total: zones.length,
    visited: zones.filter(z => inspectionStatus(z, building.date) === 'visited').length,
    attention: zones.filter(z => needsAttention(z, building.date)).length,
    assets: zones.reduce((sum, z) => sum + (z.assets?.length || 0), 0),
  };
}

export function validateFieldRecords(zone, usedIds) {
  const inspection = zone.inspection;
  if (inspection !== undefined && (!inspection || typeof inspection !== 'object' || Array.isArray(inspection) || !CHECK_KEYS.every(key => CHECK_ANSWERS.includes(inspection[key])) || (inspection.checkedOn !== undefined && (!validDate(inspection.checkedOn) || !inspectionReady(inspection))))) return false;
  if (zone.assets === undefined) return true;
  if (!Array.isArray(zone.assets) || zone.assets.length > 100) return false;
  return zone.assets.every(asset => {
    if (!asset || typeof asset.id !== 'string' || !asset.id || usedIds.has(asset.id)) return false;
    usedIds.add(asset.id);
    return typeof asset.label === 'string' && asset.label.trim().length > 0 && asset.label.length <= 80 && typeof asset.model === 'string' && asset.model.length <= 120 && ['OP', 'OU'].includes(asset.type) && ASSET_CONDITIONS.includes(asset.condition) && (asset.nextService === '' || validDate(asset.nextService));
  });
}

export function csvCell(value) {
  const text = String(value ?? '');
  // Quoting alone does not protect spreadsheet formula execution.
  const safe = /^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** @param {import('./types').Building} building @param {'ru'|'kk'} language */
export function inventoryCSV(building, language) {
  const kk = language === 'kk';
  const header = kk ? ['Нысан', 'Қабат', 'Аймақ', 'Түгендеу нөмірі', 'Модель', 'Түрі', 'Жағдайы', 'Келесі қызмет көрсету', 'Тексеру күні'] : ['Объект', 'Этаж', 'Зона', 'Инвентарный номер', 'Модель', 'Тип', 'Состояние', 'Следующее обслуживание', 'Дата осмотра'];
  const conditions = kk ? { unknown: 'Тексерілмеген', available: 'Қолжетімді', service: 'Қызмет көрсетуде', unusable: 'Пайдаланудан алынған' } : { unknown: 'Не проверено', available: 'Доступен', service: 'На обслуживании', unusable: 'Выведен из эксплуатации' };
  const name = x => kk ? x.nameKk : x.name;
  const rows = building.floors.flatMap(f => f.zones.flatMap(z => (z.assets || []).map(a => [name(building), name(f), name(z), a.label, a.model, a.type === 'OP' ? 'ОП' : 'ОУ', conditions[a.condition], a.nextService, building.date])));
  return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
