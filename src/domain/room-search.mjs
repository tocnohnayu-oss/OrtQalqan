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
    const assets=zone.assets||[],assetText=assets.map(asset=>normalize(`${asset.label} ${asset.model}`));
    const text=[roomText,...assetText].join(' ');
    if(!tokens.every(token=>text.includes(token)))return [];
    const roomMatch=tokens.every(token=>roomText.includes(token));
    const matchedAssets=tokens.length&&!roomMatch?assets.filter((_,index)=>tokens.some(token=>assetText[index].includes(token))):[];
    return [{floor,zone,matchedAssets}];
  }));
}
