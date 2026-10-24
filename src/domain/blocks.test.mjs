import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_KITS } from './room-presets.mjs';
import { decorateBlocks, sharedWall } from './block-layout.mjs';
import { furniturePrimitives } from './furniture.mjs';
import { applyFloorLayout, layoutSVG, rectPoints, validateLayout, rotateRoom, polygonArea, placementIssue, openingGeometry } from './layout.mjs';
const classroom=()=>({id:'class',zoneId:'zone',name:'Класс',nameKk:'Сынып',preset:'classroom',autoOpenings:true,points:rectPoints(0,0,8,6)});
test('building themes provide matching kits and furniture resizes without becoming capacity data',()=>{
  assert.ok(BUILDING_KITS.education.includes('classroom'));assert.ok(!BUILDING_KITS.warehouse.includes('classroom'));assert.ok(BUILDING_KITS.warehouse.includes('loading'));
  const room=classroom(),large=furniturePrimitives(room),small=furniturePrimitives({...room,points:rectPoints(0,0,4,3)});
  assert.ok(large.filter(p=>p.tag==='rect').length>20);assert.ok(small.length<large.length);assert.ok(furniturePrimitives({...room,points:rectPoints(0,0,180,180)}).length<1500);
  assert.notDeepEqual(furniturePrimitives({...room,preset:'library'}),large);
});
test('touching a corridor relocates the template door onto the shared wall',()=>{
  const room=classroom(),corridor={id:'hall',name:'Коридор',nameKk:'Дәліз',preset:'corridor',points:rectPoints(-2,0,2,6)};
  assert.equal(decorateBlocks({version:1,rooms:[room],openings:[]}).openings.find(o=>o.type==='door').edge,2);
  assert.equal(sharedWall(room,corridor).edge,3);
  const connected=decorateBlocks({version:1,rooms:[room,corridor],openings:[]});assert.equal(connected.openings.find(o=>o.type==='door').edge,3);assert.equal(validateLayout(connected),true);
  assert.deepEqual(decorateBlocks(connected),connected,'generated fitting IDs and geometry are stable');
});
test('manual opening edits persist and invalid template metadata is rejected on import',()=>{
  const room=classroom(),decorated=decorateBlocks({version:1,rooms:[room],openings:[]});
  const manual={...decorated,rooms:[{...room,autoOpenings:false}],openings:decorated.openings.map(o=>({...o,width:o.type==='door'?1.2:o.width}))};assert.deepEqual(decorateBlocks(manual),manual);
  assert.equal(validateLayout({...decorated,rooms:[{...room,preset:'untrusted'}]}),false);assert.equal(validateLayout({...decorated,rooms:[{...room,autoOpenings:'yes'}]}),false);
});
test('a ready classroom exports its symbols but never assigns a fire class or area implicitly',()=>{
  const drawing=decorateBlocks({version:1,rooms:[classroom()],openings:[]}),floor={id:'f',name:'Floor',nameKk:'Қабат',zones:[],markers:[]};
  const saved=applyFloorLayout(floor,drawing);assert.equal(saved.zones[0].hazard,'special');assert.equal(saved.zones[0].area,0);
  const svg=layoutSVG(drawing,'ru');assert.ok((svg.match(/<rect /g)||[]).length>20);assert.ok(svg.includes('Класс'));assert.equal(validateLayout(saved.layout,new Set(['zone'])),true);
});
test('quarter turns preserve measured area and rotate furniture and door geometry together',()=>{
  const original=decorateBlocks({version:1,rooms:[classroom()],openings:[]}),turned=rotateRoom(original.rooms[0],1),next=decorateBlocks({...original,rooms:[turned]});
  assert.equal(turned.rotation,90);assert.equal(polygonArea(turned.points),48);assert.equal(validateLayout(next),true);
  assert.ok(furniturePrimitives(turned).every(shape=>shape.attrs.transform==='rotate(90 4 3)'));
  const before=openingGeometry(original.rooms[0],original.openings.find(o=>o.type==='door')),after=openingGeometry(turned,next.openings.find(o=>o.type==='door'));
  assert.notEqual(after.leaf.x,before.leaf.x);assert.equal(next.openings.find(o=>o.type==='door').edge,original.openings.find(o=>o.type==='door').edge);
  const restored=rotateRoom(turned,-1);assert.deepEqual(restored.points,original.rooms[0].points);assert.equal(restored.rotation,0);
});
test('rotation cannot silently overlap another room or accept unsupported angles in a backup',()=>{
  const room=classroom(),hall={id:'hall',name:'Коридор',nameKk:'Дәліз',preset:'corridor',points:rectPoints(0,6,14,2)};
  const drawing={version:1,rooms:[room,hall],openings:[]};assert.equal(placementIssue(drawing,rotateRoom(room,1)),'overlap');
  assert.equal(validateLayout({...drawing,rooms:[{...room,rotation:45},hall]}),false);
});
