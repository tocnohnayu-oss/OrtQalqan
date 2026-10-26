import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floorWalls, buildingModel } from './building-model.mjs';
import { rectPoints } from './layout.mjs';
import { createAtlasShowcase } from '../data/atlas-showcase.mjs';

const room=(id,x,y,width,height)=>({id,zoneId:id,points:rectPoints(x,y,width,height),name:id,nameKk:id});
test('shared full and partial walls become one physical wall with the correct exterior boundary',()=>{
  const layout={rooms:[room('a',0,0,4,4),room('b',4,0,4,2)],openings:[]},walls=floorWalls(layout);
  const shared=walls.filter(wall=>!wall.external);assert.equal(shared.reduce((sum,wall)=>sum+wall.length,0),2);assert.deepEqual(new Set(shared[0].roomIds),new Set(['a','b']));
  assert.equal(walls.filter(wall=>wall.external).reduce((sum,wall)=>sum+wall.length,0),24);
});
test('a doorway on one side cuts the shared wall once, preserving the source width',()=>{
  const layout={rooms:[room('a',0,0,4,4),room('b',4,0,4,4)],openings:[{id:'d',roomId:'a',edge:1,position:.5,width:1,type:'door',hinge:'start',swing:'in'}]};
  const walls=floorWalls(layout),door=walls.filter(wall=>wall.opening==='door');assert.equal(door.length,1);assert.equal(door[0].external,false);assert.equal(door[0].length,1);assert.equal(walls.filter(wall=>!wall.external).reduce((sum,wall)=>sum+wall.length,0),4);
});
test('windows preserve actual wall spans and are not generated for walls without openings',()=>{
  const layout={rooms:[room('a',0,0,6,4)],openings:[{id:'w',roomId:'a',edge:0,position:.5,width:2,type:'window',hinge:'start',swing:'in'}]};
  const walls=floorWalls(layout);assert.equal(walls.filter(wall=>wall.opening==='window').reduce((sum,wall)=>sum+wall.length,0),2);assert.ok(walls.every(wall=>wall.external));
  assert.ok(floorWalls({...layout,openings:[]}).every(wall=>wall.opening===null));
});
test('3D uses entered geometry, preserves empty floor indices, and never extrudes image-only floors',()=>{
  const b=createAtlasShowcase({id:'model-test',date:'2026-10-26'}),original=structuredClone(b);const m=buildingModel(b,3.4);assert.equal(m.floors.length,3);assert.equal(m.floors[2].base,6.8);assert.ok(Math.abs(m.totalHeight-10.2)<1e-9);assert.deepEqual(b,original);
  delete b.floors[1].layout;b.floors[1].plan='data:image/png;base64,AAA';const next=buildingModel(b,3);assert.equal(next.floors.length,2);assert.equal(next.floors[1].index,2);assert.equal(next.floors[1].base,6);assert.deepEqual(next.missing,[b.floors[1].id]);
});
test('visual height is bounded independently of source areas and has an explicit default',()=>{
  const b=createAtlasShowcase({id:'height',date:'2026-10-26'}),before=structuredClone(b);
  assert.equal(buildingModel(b,NaN).floorHeight,3);assert.equal(buildingModel(b,100).floorHeight,6);assert.equal(buildingModel(b,-1).floorHeight,2);assert.deepEqual(b,before);
});
