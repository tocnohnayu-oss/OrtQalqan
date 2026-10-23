import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateBuilding } from './calculator.mjs';
const z=(props={})=>({id:'z1',name:'Room',nameKk:'Room',area:200,hazard:'A',category:'public',sensitive:false,temperature:'normal',automatic:'no',existing:0,...props});
const b=(zones=[z()])=>({id:'b',name:'Test',nameKk:'Test',address:'',addressKk:'',inspector:'',date:'2026-10-23',demo:true,revision:1,floors:[{id:'f',name:'Floor',nameKk:'Floor',zones,markers:[]}]});
test('area boundary is rounded upward; floor minimum is independent',()=>{
  assert.equal(calculate(b([z({area:200})])).rows[0].count,1);
  const r=calculate(b([z({area:200.01})]));assert.equal(r.rows[0].count,2);assert.equal(r.totalOP,2);
  assert.equal(calculate(b([z({area:50})])).floorExtras[0].count,1);
});
test('sensitive electronics and floor minimum do not receive powder',()=>{const r=calculate(b([z({hazard:'E',sensitive:true})]));assert.equal(r.rows[0].type,'OU');assert.ok(r.rows[0].issues.includes('ouSizing'));assert.equal(r.totalOP,0);assert.equal(r.totalOU,2);});
test('combined class A and sensitive electronics requires explicit review',()=>{const r=calculate(b([z({hazard:'AE',sensitive:true})]));assert.equal(r.rows[0].count,0);assert.equal(r.rows[0].type,null);assert.ok(r.incomplete);});
test('unsupported materials, categories and invalid area do not produce recommendations',()=>{for(const props of [{hazard:'D'},{hazard:'special'},{category:'AB'},{area:NaN},{area:-1}])assert.equal(calculate(b([z(props)])).rows[0].type,null);});
test('automatic system presence does not silently halve equipment',()=>{const r=calculate(b([z({area:1000,automatic:'yes'})]));assert.equal(r.rows[0].count,5);assert.ok(r.rows[0].issues.includes('automatic'));});
test('floor provision is not shared across floors',()=>{const input=b([z({area:800})]);input.floors.push({id:'f2',name:'Floor2',nameKk:'Floor2',markers:[],zones:[z({id:'z2',area:30})]});const r=calculate(input);assert.equal(r.totalOP,6);assert.equal(r.floorExtras[0].floorId,'f2');});
test('snapshot remains unchanged when draft is edited',()=>{const input=b();const r=calculate(input);input.floors[0].zones[0].area=999;assert.equal(r.building.floors[0].zones[0].area,200);});
test('import validates shape, marker boundaries and unique ids',()=>{assert.equal(validateBuilding(b()),true);assert.equal(validateBuilding({...b(),floors:[]}),false);const input=b();input.floors[0].markers=[{id:'m',zoneId:'z1',type:'OP',x:2,y:0}];assert.equal(validateBuilding(input),false);assert.equal(validateBuilding(b([z(),z()])),false);});
