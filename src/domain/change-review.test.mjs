import test from 'node:test';
import assert from 'node:assert/strict';
import {createShowcase} from '../data/showcase.mjs';
import {calculate} from './calculator.mjs';
import {reviewChanges} from './change-review.mjs';

const fixture=()=>{const building=JSON.parse(JSON.stringify(createShowcase({id:'review',date:'2026-10-29'})));return {building,snapshot:calculate(building,'2026-10-28T08:00:00Z')};};
test('review explains rounding without changing either source, snapshot or floor geometry',()=>{
  const {building,snapshot}=fixture(),original=structuredClone(snapshot);building.floors[0].zones[0].area=401;building.revision++;const current=structuredClone(building),r=reviewChanges(snapshot,building);
  assert.equal(r.rooms.length,1);assert.equal(r.rooms[0].id,'review-library');assert.deepEqual(r.rooms[0].fields,[{key:'area',before:400,after:401}]);assert.equal(r.rooms[0].rowBefore.count,2);assert.equal(r.rooms[0].rowAfter.count,3);assert.equal(r.totals[0].delta,1);assert.equal(r.preview.totalOP,4);assert.deepEqual(snapshot,original);assert.deepEqual(building,current);assert.deepEqual(r.preview.building.floors[0].layout,snapshot.building.floors[0].layout);
});
test('revision-only changes and optional default representations do not invent changes',()=>{
  const {building,snapshot}=fixture();building.revision+=5;delete building.usage;delete snapshot.building.kind;delete building.kind;
  assert.equal(reviewChanges(snapshot,building).changed,false);building.floors[0].zones[0].area=401;building.floors[0].zones[0].area=400;assert.equal(reviewChanges(snapshot,building).rooms.length,0);
});
test('asset changes preserve exact ids even with duplicate labels, including insertion and removal',()=>{
  const {building}=fixture(),z=building.floors[0].zones[0];z.assets=[{...z.assets[0],id:'one',label:'EQ-01'},{...z.assets[0],id:'two',label:'EQ-01'}];const snapshot=calculate(building);z.assets[1].condition='service';z.assets.splice(0,1);z.assets.push({...z.assets[0],id:'three'});const r=reviewChanges(snapshot,building),assets=r.rooms[0].assets;
  assert.deepEqual(assets.map(a=>[a.id,a.kind]),[['one','removed'],['two','changed'],['three','added']]);assert.deepEqual(assets[1].fields,[{key:'condition',before:'unknown',after:'service'}]);assert.equal(r.totals[0].delta,0);
});
test('notes, unanswered checks and explicit completion date retain their actual differences',()=>{
  const {building,snapshot}=fixture(),z=building.floors[0].zones[1];z.notes='Проверить доступ';z.inspection={access:'ok',marking:'attention',passport:'na',checkedOn:building.date};const r=reviewChanges(snapshot,building),room=r.rooms.find(room=>room.id===z.id);
  assert.equal(room.fields[0].key,'notes');assert.deepEqual(room.checks.map(item=>item.key),['access','marking','passport','checkedOn']);assert.equal(room.checks[0].before,'unknown');assert.equal(room.resultChanged,false);
});
test('scope changes explain affected rooms without assigning false room edits or unsupported zeros',()=>{
  const {building,snapshot}=fixture();building.usage='storage';const r=reviewChanges(snapshot,building);
  assert.equal(r.object[0].key,'usage');assert.equal(r.rooms.filter(room=>room.resultChanged).length,4);assert.equal(r.rooms[0].fields.length,0);assert.equal(r.rooms[0].rowAfter.type,null);assert.equal(r.totals[0].delta,null);assert.equal(r.preview.rows.some(row=>row.type),false);
});
test('floor minimum is included in actual totals while the selected room remains a one-unit result',()=>{
  const {building}=fixture();building.floors[0].zones=building.floors[0].zones.slice(0,1);delete building.floors[0].layout;building.floors[0].zones[0].area=200;const snapshot=calculate(building);building.floors[0].zones[0].area=201;const r=reviewChanges(snapshot,building);
  assert.equal(r.rooms[0].rowBefore.count,1);assert.equal(r.rooms[0].rowAfter.count,2);assert.equal(r.totals[0].before,2);assert.equal(r.totals[0].after,2);assert.equal(r.totals[0].delta,0);assert.equal(r.extrasChanged,true);
});
test('metadata, uploaded image replacement and geometry changes are visible without exposing image bytes',()=>{
  const {building,snapshot}=fixture();building.inspector='Инспектор';building.floors[0].plan='data:image/png;base64,NEW';snapshot.building.floors[0].plan='data:image/png;base64,OLD';building.floors[0].layout.rooms[0].points[0].x+=1;const r=reviewChanges(snapshot,building);
  assert.equal(r.rooms.length,0);assert.equal(r.object[0].key,'inspector');assert.ok(r.floorChanges[0].fields.some(item=>item.key==='layout'));assert.deepEqual(r.floorChanges[0].fields.find(item=>item.key==='plan'),{key:'plan',before:true,after:true});
});
test('added, removed and cross-floor rooms are matched by source id',()=>{
  const {building,snapshot}=fixture(),floor=building.floors[0],moved=floor.zones.pop();floor.zones.shift();floor.zones.push({...structuredClone(floor.zones[0]),id:'new',name:'Новая'});building.floors.push({id:'new-floor',name:'Второй',nameKk:'Екінші',zones:[moved],markers:[]});const r=reviewChanges(snapshot,building);
  assert.equal(r.rooms.find(room=>room.id==='review-library').kind,'removed');assert.equal(r.rooms.find(room=>room.id==='new').kind,'added');assert.equal(r.rooms.find(room=>room.id===moved.id).fields.find(item=>item.key==='floor').after.id,'new-floor');assert.ok(r.floorChanges.some(floor=>floor.id==='new-floor'&&floor.kind==='added'));
});
test('foreign objects are rejected and different profile versions never receive an arithmetic delta',()=>{
  const {building,snapshot}=fixture();snapshot.rulesVersion='other-profile';building.floors[0].zones[0].area=401;const r=reviewChanges(snapshot,building);assert.equal(r.sameRules,false);assert.ok(r.totals.every(total=>total.delta===null));building.id='another';assert.equal(reviewChanges(snapshot,building),null);
});
