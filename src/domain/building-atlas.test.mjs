import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildingAtlas, roomFieldState } from './building-atlas.mjs';
import { calculate } from './calculator.mjs';
import { createShowcase } from '../data/showcase.mjs';

const fixture=()=>{const b=createShowcase({id:'atlas',date:'2026-10-26'});for(const z of b.floors[0].zones){delete z.notes;z.assets=[];}return b;};
test('atlas joins actual floors and zones without inventing missing geometry or changing the source',()=>{
  const b=fixture(),f=b.floors[0];f.zones.push({...f.zones[1],id:'unplaced',area:0});const original=structuredClone(b),model=buildingAtlas(b,calculate(b));
  assert.equal(model.floors[0].source,'drawing');assert.equal(model.floors[0].mapped,4);assert.equal(model.floors[0].rooms.length,5);assert.equal(model.floors[0].rooms[4].mapped,false);assert.deepEqual(b,original);
  delete f.layout;assert.equal(buildingAtlas(b,calculate(b)).floors[0].source,'empty');
});
test('calculation colors and counts are hidden for another revision or object, including identical zone IDs',()=>{
  const b=fixture(),snapshot=calculate(b);assert.equal(buildingAtlas(b,snapshot).floors[0].rooms[0].count,2);
  b.revision++;let model=buildingAtlas(b,snapshot);assert.equal(model.stale,true);assert.ok(model.floors[0].rooms.every(room=>room.count===null&&room.calculation==='stale'));
  b.revision=snapshot.revision;b.id='other';assert.equal(buildingAtlas(b,snapshot).stale,true);
});
test('manual zones and non-public uses retain the absence of a supported equipment recommendation',()=>{
  const b=fixture();let m=buildingAtlas(b,calculate(b));assert.equal(m.floors[0].rooms[3].calculation,'manual');assert.equal(m.floors[0].rooms[3].count,null);
  b.usage='storage';m=buildingAtlas(b,calculate(b));assert.ok(m.floors[0].rooms.every(room=>room.calculation==='manual'&&room.count===null));
});
test('field layer separates completed observations, known attention and unknown equipment data',()=>{
  const z=fixture().floors[0].zones[0],date='2026-10-26';assert.equal(roomFieldState(z,date),'pending');
  z.inspection={access:'ok',marking:'ok',passport:'na',checkedOn:date};assert.equal(roomFieldState(z,date),'visited');
  z.notes='Проверить документ';assert.equal(roomFieldState(z,date),'attention');delete z.notes;
  z.assets=[{id:'x',label:'X',model:'',type:'OP',condition:'unknown',nextService:''}];assert.equal(roomFieldState(z,date),'verify');
  z.assets[0].condition='available';z.assets[0].nextService='2026-10-20';assert.equal(roomFieldState(z,date),'attention');assert.equal(z.assets[0].condition,'available');
});
test('past inspection dates do not become completed records on the reference date',()=>{
  const b=fixture(),z=b.floors[0].zones[0];z.inspection={access:'ok',marking:'ok',passport:'na',checkedOn:'2026-10-25'};
  const m=buildingAtlas(b,calculate(b));assert.equal(m.visited,0);assert.equal(m.floors[0].rooms[0].field,'started');assert.equal(m.next.zone.id,z.id);
});
test('image markers count only on an existing image and do not create room contours',()=>{
  const b=fixture(),f=b.floors[0];delete f.layout;f.markers=[{id:'m',zoneId:f.zones[0].id,x:.3,y:.6,type:'OP'}];
  assert.equal(buildingAtlas(b,calculate(b)).floors[0].mapped,0);f.plan='data:image/png;base64,AAA';const m=buildingAtlas(b,calculate(b));assert.equal(m.floors[0].mapped,1);assert.equal(m.floors[0].source,'image');assert.equal(f.layout,undefined);
});
