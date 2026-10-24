import test from 'node:test';
import assert from 'node:assert/strict';
import { createShowcase } from '../data/showcase.mjs';
import { calculate, validateBuilding } from './calculator.mjs';
import { polygonArea, validateLayout } from './layout.mjs';

test('the opt-in training object is valid, explicitly synthetic and has areas matching its furnished geometry',()=>{
  const b=createShowcase({id:'training-a',date:'2026-10-24'}),floor=b.floors[0];
  assert.equal(validateBuilding(b),true);assert.equal(b.demo,true);assert.equal(floor.layout.example,true);assert.equal(b.address,'');assert.equal(b.name.includes('НИШ'),false);
  assert.equal(validateLayout(floor.layout,new Set(floor.zones.map(z=>z.id))),true);assert.equal(floor.layout.rooms.length,5);
  for(const z of floor.zones){const room=floor.layout.rooms.find(r=>r.zoneId===z.id);assert.equal(polygonArea(room.points),z.area);assert.ok(floor.layout.openings.some(o=>o.roomId===room.id&&o.type==='door'));}
  assert.equal(floor.zones.some(z=>z.inspection?.checkedOn),false,'the demonstration never pretends the inspection was completed');
});
test('the presentation example demonstrates both extinguisher types, an unsupported room and a real rounding boundary without mutating its source',()=>{
  const first=createShowcase({id:'a',date:'2026-10-24'}),second=createShowcase({id:'b',date:'2026-10-24'}),before=calculate(first);
  assert.equal(before.totalOP,3);assert.equal(before.totalOU,1);assert.equal(before.rows.filter(r=>!r.type).length,1);
  first.floors[0].zones[0].area=401;const after=calculate(first);assert.equal(after.totalOP,4);assert.equal(after.totalOU,1);
  assert.equal(before.building.floors[0].zones[0].area,400);assert.equal(second.floors[0].zones[0].area,400);
});
