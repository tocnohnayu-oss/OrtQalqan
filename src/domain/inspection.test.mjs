import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateBuilding } from './calculator.mjs';
import { csvCell, inspectionStatus, inspectionSummary, inventoryCSV, needsAttention, serviceStatus, validDate } from './inspection.mjs';

const asset=(patch={})=>({id:'a',label:'INV-01',model:'ОП-4',type:'OP',condition:'available',nextService:'2026-12-15',...patch});
const zone=(patch={})=>({id:'z',name:'Room',nameKk:'Бөлме',area:240,hazard:'AE',category:'public',sensitive:false,temperature:'normal',automatic:'no',existing:1,...patch});
const building=(patch={})=>({id:'b',name:'Office',nameKk:'Кеңсе',address:'',addressKk:'',inspector:'',date:'2026-10-24',demo:false,revision:1,floors:[{id:'f',name:'Floor',nameKk:'Қабат',markers:[],zones:[zone()]}],...patch});
const complete={access:'ok',marking:'attention',passport:'na',checkedOn:'2026-10-24'};

test('saved text observations stay in attention even without unfinished checks or equipment',()=>{
  assert.equal(needsAttention(zone({notes:'Проверить свободный подход.'}),'2026-10-24'),true);
  assert.equal(needsAttention(zone({notes:'  \n  '}),'2026-10-24'),false);
  const observed=zone({notes:'Уточнить размещение.',inspection:{...complete,marking:'ok'}}),b=building();b.floors[0].zones=[observed];
  assert.equal(inspectionStatus(observed,b.date),'visited');assert.equal(inspectionSummary(b).attention,1);assert.equal(inspectionSummary(b).visited,1);
});
test('a missing asset service date needs clarification without inventing deadlines from an invalid reference date',()=>{
  assert.equal(needsAttention(zone({assets:[asset({nextService:''})]}),'2026-10-24'),true);
  assert.equal(needsAttention(zone({assets:[asset()]}),'2026-10-24'),false);
  assert.equal(needsAttention(zone({assets:[asset()]}),''),false);
  assert.equal(needsAttention(zone({assets:[asset({nextService:''})]}),''),true);
  assert.equal(needsAttention(zone(),''),false);
});

test('calendar dates reject impossible values and use exact leap days',()=>{
  assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2026-02-29'),false);
  for(const date of ['',undefined,'2026-13-01','2026-04-31','2026-1-1','0000-01-01','2026-10-24T12:00:00Z'])assert.equal(validDate(date),false);
});
test('a room cannot become visited from incomplete answers or an earlier inspection date',()=>{
  assert.equal(inspectionStatus(zone(),'2026-10-24'),'pending');
  assert.equal(inspectionStatus(zone({inspection:{...complete,passport:'unknown'}}),'2026-10-24'),'started');
  assert.equal(inspectionStatus(zone({inspection:complete}),'2026-10-24'),'visited');
  assert.equal(inspectionStatus(zone({inspection:complete}),'2026-10-25'),'started');
  assert.equal(inspectionStatus(zone({inspection:complete}),''),'started');
});
test('the planning window treats today and 30 days as due soon without changing equipment condition',()=>{
  const a=asset();assert.equal(serviceStatus({...a,nextService:'2026-10-23'},'2026-10-24'),'overdue');
  assert.equal(serviceStatus({...a,nextService:'2026-10-24'},'2026-10-24'),'soon');
  assert.equal(serviceStatus({...a,nextService:'2026-11-23'},'2026-10-24'),'soon');
  assert.equal(serviceStatus({...a,nextService:'2026-11-24'},'2026-10-24'),'scheduled');
  assert.equal(serviceStatus({...a,nextService:''},'2026-10-24'),'undated');
  assert.equal(serviceStatus(a,''),'undated');assert.equal(a.condition,'available');
});
test('visited rooms can still need attention and unverified assets stay explicit',()=>{
  const b=building();b.floors[0].zones=[zone({inspection:complete}),zone({id:'z2',assets:[asset({condition:'unknown'})]})];
  assert.deepEqual(inspectionSummary(b),{total:2,visited:1,attention:2,assets:1});
  assert.equal(needsAttention(zone({assets:[asset()]}),b.date),false);
});
test('legacy backups remain valid and snapshots isolate field records from future edits',()=>{
  const b=building();assert.equal(validateBuilding(b),true);b.floors[0].zones[0].assets=[asset()];b.floors[0].zones[0].inspection=complete;
  assert.equal(validateBuilding(b),true);const snapshot=calculate(b);b.floors[0].zones[0].assets[0].label='Changed';
  assert.equal(snapshot.building.floors[0].zones[0].assets[0].label,'INV-01');
  assert.equal(snapshot.rows[0].count,2);assert.equal(snapshot.building.floors[0].zones[0].existing,1);
});
test('imports reject forged completed checks, duplicate equipment IDs and malformed passport values',()=>{
  const b=building(),z=b.floors[0].zones[0];z.inspection={...complete,passport:'unknown'};assert.equal(validateBuilding(b),false);
  delete z.inspection;z.assets=[asset(),asset()];assert.equal(validateBuilding(b),false);
  for(const patch of [{label:''},{label:'x'.repeat(81)},{condition:'safe'},{nextService:'2026-02-30'},{type:'water'}]){z.assets=[asset(patch)];assert.equal(validateBuilding(b),false);}
  z.assets=[asset()];b.floors[0].zones.push(zone({id:'z2',assets:[asset()]}));assert.equal(validateBuilding(b),false);
});
test('non-public object purposes do not inherit a public-room calculation',()=>{
  for(const usage of ['storage','production','unknown']){const b=building({usage});const r=calculate(b);assert.equal(r.rows[0].type,null);assert.ok(r.rows[0].issues.includes('unsupportedUse'));assert.equal(r.floorExtras.length,0);assert.equal(r.totalOP,0);}
  assert.equal(calculate(building({usage:'public'})).rows[0].count,2);
});
test('spreadsheet exports quote separators and neutralize formulas, including leading whitespace',()=>{
  assert.equal(csvCell('A;"B"'),'"A;""B"""');
  for(const value of ['=1+1','+cmd','@SUM(A1)','-1+2','  =1','\tvalue','\n=1'])assert.equal(csvCell(value).startsWith('"\''),true);
  const b=building();b.floors[0].zones[0].assets=[asset({label:'=1+1'})];const csv=inventoryCSV(b,'kk');
  assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('Түгендеу нөмірі'));assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('Қолжетімді'));
});
