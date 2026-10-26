import { CHECK_KEYS, inspectionStatus, serviceStatus, resumeInspection } from './inspection.mjs';
import { attentionItems } from './attention.mjs';

/** Saved field information only. A completed record is not a safety verdict. */
export function roomFieldState(zone, date) {
  if (CHECK_KEYS.some(key=>zone.inspection?.[key]==='attention') || zone.notes?.trim()
    || (zone.assets||[]).some(asset=>['service','unusable'].includes(asset.condition)||['overdue','soon'].includes(serviceStatus(asset,date)))) return 'attention';
  if ((zone.assets||[]).some(asset=>asset.condition==='unknown'||!asset.nextService)) return 'verify';
  return inspectionStatus(zone,date);
}

/** @param {import('./types').Building} building @param {import('./types').Snapshot} snapshot */
export function buildingAtlas(building, snapshot) {
  const stale=snapshot.building.id!==building.id||snapshot.revision!==building.revision;
  const attention=attentionItems(building),rows=new Map(snapshot.rows.map(row=>[row.zoneId,row]));
  const floors=building.floors.map(floor=>{
    const mapped=new Set((floor.layout?.rooms||[]).map(room=>room.zoneId).filter(Boolean));
    if(floor.plan)for(const marker of floor.markers)mapped.add(marker.zoneId);
    const rooms=floor.zones.map(zone=>{
      const row=rows.get(zone.id);
      return {zone,field:roomFieldState(zone,building.date),visited:inspectionStatus(zone,building.date)==='visited',
        mapped:mapped.has(zone.id),attention:attention.filter(item=>item.zone.id===zone.id).length,
        calculation:stale?'stale':row?.type||'manual',count:!stale&&row?.type?row.count:null};
    });
    return {floor,rooms,source:floor.layout?.rooms.length?'drawing':floor.plan?'image':'empty',
      mapped:rooms.filter(room=>room.mapped).length,visited:rooms.filter(room=>room.visited).length,
      attention:rooms.reduce((sum,room)=>sum+room.attention,0)};
  });
  const entries=building.floors.flatMap(floor=>floor.zones.map(zone=>({floor,zone})));
  return {floors,stale,attention:attention.length,next:resumeInspection(entries,building.date),
    visited:floors.reduce((sum,floor)=>sum+floor.visited,0),total:entries.length};
}
