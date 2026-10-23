/** Preliminary, explicitly scoped public-building profile; see docs/NORMATIVE_RESEARCH.md. */
export const RULES_VERSION = 'public-pilot-2026-10-23';
export const SOURCE_URL = 'https://old.adilet.zan.kz/rus/docs/V2200026867';

export function calculate(building, now = new Date().toISOString()) {
  const rows = [];
  const floorExtras = [];
  for (const floor of building.floors) {
    for (const z of floor.zones) {
      const issues = [];
      let type = null;
      let count = 0;
      let rate = 0;
      if (!Number.isFinite(z.area) || z.area <= 0 || z.area > 1000000) issues.push('invalidArea');
      if (z.category !== 'public') issues.push('unsupportedCategory');
      if (!['A', 'AE', 'E'].includes(z.hazard)) issues.push('specialHazard');
      if (z.sensitive && ['A', 'AE'].includes(z.hazard)) issues.push('sensitiveA');
      if (!issues.length) {
        type = z.hazard === 'E' && z.sensitive ? 'OU' : 'OP';
        // Design interpretation: proportional provision rounded upward, then floor minimum.
        // OP column 5(4): 4 / 800m²; OU larger column: 2 / 800m² (E only).
        rate = type === 'OP' ? 200 : 400;
        count = Math.ceil(z.area / rate);
        if (type === 'OU') issues.push('ouSizing');
        if (z.temperature !== 'normal') issues.push('temperature');
        if (z.automatic !== 'no') issues.push('automatic');
      }
      rows.push({ zoneId: z.id, floorId: floor.id, type, count, area: z.area, rate, issues, rules: type ? ['PPB-APP3-T1-PUBLIC', 'STRK-5.3'] : [] });
    }
    const provision = rows.filter(r => r.floorId === floor.id).reduce((sum, r) => sum + r.count, 0);
    // Apply only to floors with at least one supported zone. Never imply completeness of others.
    if (floor.zones.length && rows.some(r => r.floorId === floor.id && r.type) && provision < 2) {
      const compatible = rows.find(r => r.floorId === floor.id && r.type)?.type;
      floorExtras.push({ floorId: floor.id, type: compatible, count: 2 - provision });
    }
  }
  return {
    id: `calc-${now}`, createdAt: now, revision: building.revision, rulesVersion: RULES_VERSION,
    building: structuredClone(building), rows, floorExtras,
    totalOP: rows.filter(r => r.type === 'OP').reduce((s, r) => s + r.count, 0) + floorExtras.filter(r => r.type === 'OP').reduce((s, r) => s + r.count, 0),
    totalOU: rows.filter(r => r.type === 'OU').reduce((s, r) => s + r.count, 0) + floorExtras.filter(r => r.type === 'OU').reduce((s, r) => s + r.count, 0),
    incomplete: !rows.length || rows.some(r => r.issues.length), preliminary: true,
  };
}

export function validateBuilding(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.floors) || !value.floors.length || value.floors.length > 30) return false;
  if (typeof value.name !== 'string' || typeof value.nameKk !== 'string' || typeof value.address !== 'string' || typeof value.addressKk !== 'string' || typeof value.inspector !== 'string' || typeof value.demo !== 'boolean' || typeof value.id !== 'string' || !Number.isInteger(value.revision) || typeof value.date !== 'string') return false;
  const ids = new Set();
  return value.floors.every(f => {
    if (!f || typeof f.id !== 'string' || ids.has(f.id) || typeof f.name !== 'string' || typeof f.nameKk !== 'string' || !Array.isArray(f.zones) || f.zones.length > 100 || !Array.isArray(f.markers)) return false;
    ids.add(f.id);
    if (f.plan && (typeof f.plan !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(f.plan) || f.plan.length > 3000000)) return false;
    return f.zones.every(z => {
      if (!z || typeof z.id !== 'string' || ids.has(z.id)) return false;
      ids.add(z.id);
      return typeof z.name === 'string' && typeof z.nameKk === 'string' && Number.isFinite(z.area) && z.area >= 0 && z.area <= 1000000 && ['A','AE','E','B','C','D','special'].includes(z.hazard) && ['public','AB','V','GD'].includes(z.category) && typeof z.sensitive === 'boolean' && ['normal','cold','unknown'].includes(z.temperature) && ['yes','no','unknown'].includes(z.automatic) && Number.isInteger(z.existing) && z.existing >= 0;
    }) && f.markers.every(m => m && typeof m.id === 'string' && Number.isFinite(m.x) && Number.isFinite(m.y) && m.x >= 0 && m.x <= 1 && m.y >= 0 && m.y <= 1 && ['OP','OU'].includes(m.type) && f.zones.some(z => z.id === m.zoneId));
  });
}
