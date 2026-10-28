const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replaceAll('ё','е').replace(/[‐‑‒–—]/g,'-');

/** Search only the open building. Room/floor and asset identifiers remain distinct matches.
 * @param {import('./types').Building} building
 * @param {string} query
 */
export function findRooms(building,query='') {
  const tokens=normalize(query).trim().split(/\s+/u).filter(Boolean);
  if(!tokens.length)return building.floors.flatMap(floor=>floor.zones.map(zone=>({floor,zone,matchedAssets:[]})));
  return building.floors.flatMap(floor=>floor.zones.flatMap(zone=>{
    const roomText=normalize(`${floor.name} ${floor.nameKk} ${zone.name} ${zone.nameKk}`);
    const roomMatch=tokens.every(token=>roomText.includes(token));
    if(roomMatch)return [{floor,zone,matchedAssets:[]}];
    // A query may use floor/room context, but equipment terms must match one record.
    const matchedAssets=(zone.assets||[]).filter(asset=>{const text=normalize(`${asset.label} ${asset.model}`);return tokens.every(token=>roomText.includes(token)||text.includes(token));});
    return matchedAssets.length?[{floor,zone,matchedAssets}]:[];
  }));
}
