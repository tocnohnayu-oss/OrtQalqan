import { calculate } from './calculator.mjs';
export function scenarioPatch(zone, kind, amount=50) {
  switch(kind){
    case 'area': return Number.isFinite(zone.area)&&zone.area>0&&Number.isFinite(amount)&&amount>=0&&amount<=200?{area:Math.round(zone.area*(1+amount/100)*100)/100}:{};
    case 'electronics': return {sensitive:true};
    case 'materials': return {hazard:'special'};
    case 'winter': return {temperature:'cold'};
    case 'automatic': return {automatic:'yes'};
    case 'inventory': return {existing:0};
    default: return {};
  }
}

/** Simulations never mutate a draft or import plan images into their result. */
export function simulateScenario(building,zoneId,kind,amount=50){
  const base={...building,floors:building.floors.map(f=>({...f,plan:undefined,markers:[],zones:f.zones.map(z=>({...z}))}))};
  const next=structuredClone(base),zone=next.floors.flatMap(f=>f.zones).find(z=>z.id===zoneId);
  if(!zone)return null;
  const patch=scenarioPatch(zone,kind,amount);
  Object.assign(zone,patch);next.revision++;
  const current=calculate(base),proposed=calculate(next);
  return {patch,current,proposed,currentRow:current.rows.find(r=>r.zoneId===zoneId),proposedRow:proposed.rows.find(r=>r.zoneId===zoneId)};
}
