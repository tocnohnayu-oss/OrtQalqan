import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attentionCSV, attentionItems } from './attention.mjs';
import { calculate } from './calculator.mjs';
import { attentionReason, attentionSource } from '../locales/attention.mjs';
import { createShowcase } from '../data/showcase.mjs';

const asset=(id,patch={})=>({id,label:'DEMO-'+id,model:'ОП-4',type:'OP',condition:'available',nextService:'2026-12-15',...patch});
const fixture=()=>{const b=createShowcase({id:'attention',date:'2026-10-25'});for(const f of b.floors)for(const z of f.zones){delete z.inspection;delete z.notes;z.assets=[];}return b;};

test('attention index includes completed observations and combines asset reasons without duplicating equipment',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.inspection={access:'attention',marking:'ok',passport:'na',checkedOn:b.date};z.notes='Освободить подход.';
  z.assets=[asset('service',{condition:'service',nextService:'2026-10-20'})];
  const original=structuredClone(b),items=attentionItems(b);assert.equal(items.length,2);assert.deepEqual(items[0].reasons,['access','note']);assert.deepEqual(items[1].reasons,['service','overdue']);assert.equal(items[1].group,'recorded');assert.deepEqual(b,original);
  assert.match(attentionSource(items[0],b.date,'ru'),/Осмотр записан/);
});
test('today and day 30 are planning entries, day 31 is excluded and overdue dates never change asset condition',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.assets=[asset('31',{nextService:'2026-11-25'}),asset('30',{nextService:'2026-11-24'}),asset('today',{nextService:b.date}),asset('past',{nextService:'2026-10-24'})];
  const items=attentionItems(b);assert.deepEqual(items.map(item=>item.asset.id),['past','today','30']);assert.equal(items[0].group,'overdue');assert.equal(items[0].asset.condition,'available');assert.match(attentionReason(items[0],'overdue','kk'),/2026-10-24/);
  b.date='2026-10-24';assert.equal(attentionItems(b).find(item=>item.asset.id==='past').group,'soon');
});
test('unknown state and missing dates stay in a distinct data-clarification group',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.assets=[asset('unknown',{condition:'unknown'}),asset('undated',{nextService:''}),asset('both',{condition:'unknown',nextService:''})];
  const items=attentionItems(b);assert.equal(items.length,3);assert.ok(items.every(item=>item.group==='verify'));assert.deepEqual(items[2].reasons,['unverified','undated']);
  assert.deepEqual(attentionItems(fixture()),[],'empty records create no automatic findings');
});
test('invalid reference dates cannot create overdue entries and old observations retain their source date',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.assets=[asset('past',{nextService:'2026-10-20'})];b.date='2026-02-30';assert.equal(attentionItems(b).length,0);
  z.inspection={access:'attention',marking:'ok',passport:'ok',checkedOn:'2026-10-24'};b.date='2026-10-25';const item=attentionItems(b).find(item=>item.kind==='room');assert.match(attentionSource(item,b.date,'ru'),/другую дату · 2026-10-24/);
  delete z.inspection.checkedOn;assert.match(attentionSource(attentionItems(b)[0],b.date,'kk'),/аяқталмаған/);
});
test('the index respects object scope and IDs, survives matching inventory numbers, and follows source edits',()=>{
  const b=fixture(),z=b.floors[0].zones[0],upper=structuredClone(b.floors[0]);upper.id='upper';upper.zones=[{...structuredClone(z),id:'other',assets:[asset('other',{label:'SAME',condition:'unusable'})]}];b.floors.push(upper);z.assets=[asset('first',{label:'SAME',condition:'service'})];
  assert.deepEqual(attentionItems(b).map(item=>item.asset.id),['first','other']);z.assets[0].condition='available';assert.deepEqual(attentionItems(b).map(item=>item.asset.id),['other']);assert.equal(attentionItems(fixture()).length,0);
});
test('CSV carries exact sources, bilingual notes and dates, protects spreadsheet formulas, and snapshot exports stay immutable',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.notes='=HYPERLINK("demo"); Ә Ғ Қ Ң Ө Ұ Ү Һ І\nЕскерту';z.assets=[asset('x',{label:'  =1+1',condition:'unusable'})];const snapshot=calculate(b);
  const csv=attentionCSV(b,'kk');assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/Қосу негізі/);assert.match(csv,/"'  =1\+1"/);assert.match(csv,/"'=HYPERLINK\(""demo""\);/);assert.ok(csv.includes('Ә Ғ Қ Ң Ө Ұ Ү Һ І'));assert.ok(csv.includes('Оқу деректері'));
  z.notes='Changed';z.assets=[];assert.equal(attentionCSV(snapshot.building,'kk'),csv);assert.notEqual(attentionCSV(b,'kk'),csv);
});
