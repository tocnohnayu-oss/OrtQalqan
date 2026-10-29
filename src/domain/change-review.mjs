import {calculate, RULES_VERSION} from './calculator.mjs';
import {EMPTY_INSPECTION} from './inspection.mjs';

const objectKeys=['name','nameKk','address','addressKk','inspector','date','demo','kind','usage'];
const zoneKeys=['name','nameKk','area','hazard','category','sensitive','temperature','automatic','existing','notes'];
const assetKeys=['label','model','type','condition','nextService'];
const checkKeys=['access','marking','passport','checkedOn'];
const canonical=value=>value===undefined?'':Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).filter(key=>value[key]!==undefined).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}':JSON.stringify(value);
const same=(a,b)=>canonical(a)===canonical(b);
const ids=items=>(items||[]).map(item=>item.id);
const union=(a,b)=>[...new Set([...a,...b])];
const fields=(before,after,keys)=>keys.filter(key=>!same(before?.[key],after?.[key])).map(key=>({key,before:before?.[key],after:after?.[key]}));
const normalizedObject=building=>({...building,kind:building.kind||'other',usage:building.usage||'public'});
const rowValue=row=>row?{type:row.type,count:row.count,area:row.area,rate:row.rate,issues:row.issues,rules:row.rules}:null;
const zones=building=>new Map(building.floors.flatMap(floor=>floor.zones.map(zone=>[zone.id,{floor,zone}])));

/** A read-only comparison against one immutable report. Never saves a result or changes sources. */
export function reviewChanges(snapshot,building){
  if(snapshot.building.id!==building.id)return null;
  const before=snapshot.building,preview=calculate(building,snapshot.createdAt),sameRules=snapshot.rulesVersion===RULES_VERSION;
  const object=fields(normalizedObject(before),normalizedObject(building),objectKeys);
  if(!same(ids(before.floors),ids(building.floors)))object.push({key:'floorOrder',before:ids(before.floors),after:ids(building.floors)});
  const floors=union(ids(before.floors),ids(building.floors)).map(id=>{
    const old=before.floors.find(floor=>floor.id===id),next=building.floors.find(floor=>floor.id===id);
    const changes=fields(old,next,['name','nameKk']);
    // Never include uploaded image bytes in a textual change record.
    if(!same(old?.plan,next?.plan))changes.push({key:'plan',before:!!old?.plan,after:!!next?.plan});
    if(!same(old?.layout,next?.layout))changes.push({key:'layout',before:!!old?.layout,after:!!next?.layout});
    if(!same(old?.markers||[],next?.markers||[]))changes.push({key:'markers',before:old?.markers.length||0,after:next?.markers.length||0});
    if(!same(ids(old?.zones),ids(next?.zones)))changes.push({key:'roomOrder',before:ids(old?.zones),after:ids(next?.zones)});
    return {id,before:old,after:next,kind:!old?'added':!next?'removed':'changed',fields:changes};
  });
  const oldZones=zones(before),newZones=zones(building);
  const rooms=union([...oldZones.keys()],[...newZones.keys()]).map(id=>{
    const old=oldZones.get(id),next=newZones.get(id);
    const changes=fields({...old?.zone,notes:old?.zone.notes||''},{...next?.zone,notes:next?.zone.notes||''},zoneKeys);
    if(old&&next&&old.floor.id!==next.floor.id)changes.push({key:'floor',before:old.floor,after:next.floor});
    const checks=fields(old?.zone.inspection||EMPTY_INSPECTION,next?.zone.inspection||EMPTY_INSPECTION,checkKeys);
    const assets=union(ids(old?.zone.assets),ids(next?.zone.assets)).map(assetId=>{
      const a=old?.zone.assets?.find(item=>item.id===assetId),b=next?.zone.assets?.find(item=>item.id===assetId);
      return {id:assetId,before:a,after:b,kind:!a?'added':!b?'removed':'changed',fields:fields(a,b,assetKeys)};
    }).filter(asset=>asset.fields.length);
    const rowBefore=snapshot.rows.find(row=>row.zoneId===id),rowAfter=preview.rows.find(row=>row.zoneId===id);
    const resultChanged=!same(rowValue(rowBefore),rowValue(rowAfter));
    return {id,before:old?.zone,after:next?.zone,floorBefore:old?.floor,floorAfter:next?.floor,kind:!old?'added':!next?'removed':'changed',fields:changes,checks,assets,rowBefore,rowAfter,resultChanged};
  }).filter(room=>room.kind!=='changed'||room.fields.length||room.checks.length||room.assets.length||room.resultChanged);
  const floorChanges=floors.filter(floor=>floor.kind!=='changed'||floor.fields.length);
  const totals=(['OP','OU']).map(type=>({type,before:type==='OP'?snapshot.totalOP:snapshot.totalOU,after:type==='OP'?preview.totalOP:preview.totalOU,
    delta:sameRules&&snapshot.rows.some(row=>row.type)&&preview.rows.some(row=>row.type)?(type==='OP'?preview.totalOP-snapshot.totalOP:preview.totalOU-snapshot.totalOU):null}));
  return {compatible:true,sameRules,preview,object,floors,floorChanges,rooms,totals,
    changed:!!(object.length||floorChanges.length||rooms.length||!sameRules),
    extrasChanged:!same(snapshot.floorExtras,preview.floorExtras)};
}
