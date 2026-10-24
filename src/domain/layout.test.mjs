import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFloorLayout, closeContour, fitOpenings, interiorsOverlap, layoutSVG, moveVertex, openingCollision, openingGeometry, placementIssue, polygonArea, rectPoints, validPolygon, validateLayout } from './layout.mjs';
import { calculate, validateBuilding } from './calculator.mjs';

const room=(id='r',points=rectPoints(0,0,8,6),patch={})=>({id,zoneId:'z',name:'Room',nameKk:'Бөлме',points,...patch});
const door=(patch={})=>({id:'d',roomId:'r',edge:0,position:.5,width:.9,type:'door',hinge:'start',swing:'in',...patch});
const layout=(rooms=[room()],openings=[])=>({version:1,rooms,openings});
const floor=()=>({id:'f',name:'Этаж',nameKk:'Қабат',markers:[],zones:[{id:'z',name:'Room',nameKk:'Бөлме',area:240,hazard:'AE',category:'public',sensitive:false,temperature:'normal',automatic:'no',existing:1}]});
const building=()=>({id:'b',name:'Object',nameKk:'Нысан',address:'',addressKk:'',inspector:'',date:'2026-10-24',revision:1,demo:false,floors:[floor()]});

test('measured polygons support rectangles and concave rooms without inventing area',()=>{
  const l=[{x:0,y:0},{x:8,y:0},{x:8,y:6},{x:5,y:6},{x:5,y:3},{x:0,y:3}];
  assert.equal(validPolygon(l),true);assert.equal(polygonArea(l),33);assert.equal(polygonArea(rectPoints(0,0,8,6)),48);
  assert.equal(polygonArea([...l].reverse()),33);
});
test('diagonal, crossing, degenerate and unbounded contours are rejected',()=>{
  assert.equal(validPolygon([{x:0,y:0},{x:4,y:0},{x:5,y:3},{x:0,y:3}]),false);
  assert.equal(validPolygon([{x:0,y:0},{x:6,y:0},{x:6,y:4},{x:2,y:4},{x:2,y:-2},{x:0,y:-2}]),false);
  for(const points of [rectPoints(0,0,0,4),rectPoints(0,0,.1,4),rectPoints(0,0,NaN,4),rectPoints(0,0,400,4)])assert.equal(validPolygon(points),false);
});
test('walls may be shared, while interior overlap and containment are detected',()=>{
  assert.equal(interiorsOverlap(rectPoints(0,0,8,6),rectPoints(8,0,5,6)),false);
  assert.equal(interiorsOverlap(rectPoints(0,0,8,6),rectPoints(7.75,0,5,6)),true);
  assert.equal(interiorsOverlap(rectPoints(0,0,8,6),rectPoints(2,2,1,1)),true);
  const l=closeContour([{x:0,y:0},{x:8,y:0},{x:8,y:3},{x:3,y:3},{x:3,y:8},{x:0,y:8}]);
  assert.equal(interiorsOverlap(l,rectPoints(4,4,2,2)),false,'concave empty space is not mistaken for a room interior');
  assert.equal(placementIssue(layout(),room('other',rectPoints(8,0,4,6))),null);
});
test('closing a contour and moving corners preserve perpendicular walls without mutation',()=>{
  const input=[{x:0,y:0},{x:4,y:0},{x:8,y:0},{x:8,y:6},{x:5,y:6},{x:5,y:3}];
  const before=structuredClone(input),closed=closeContour(input);assert.equal(validPolygon(closed),true);assert.deepEqual(input,before);
  const points=rectPoints(0,0,8,6),moved=moveVertex(points,2,{x:10,y:7});assert.equal(validPolygon(moved),true);assert.equal(polygonArea(moved),70);assert.equal(polygonArea(points),48);
});
test('door geometry follows hinge and swing; a wall edit never silently shrinks a door',()=>{
  const r=room(),d=door(),inside=openingGeometry(r,d),outside=openingGeometry(r,{...d,swing:'out'});
  assert.equal(inside.leaf.y,.9);assert.equal(outside.leaf.y,-.9);
  assert.notEqual(openingGeometry(r,{...d,hinge:'end'}).hinge.x,inside.hinge.x);
  assert.equal(fitOpenings({...r,points:rectPoints(0,0,.5,6)},[d]),null);
  assert.equal(fitOpenings({...r,points:rectPoints(0,0,2,6)},[door({position:.95})])[0].width,.9);
});
test('openings cannot overlap on the same wall or reference missing edges and rooms',()=>{
  const base=layout([room()],[door()]);assert.equal(validateLayout(base),true);
  assert.equal(openingCollision(base,door({id:'window',type:'window',position:.55,width:1.5})),true);
  assert.equal(validateLayout(layout([room()],[door({edge:7})])),false);
  assert.equal(validateLayout(layout([room()],[door({roomId:'missing'})])),false);
  assert.equal(validateLayout(layout([room()],[door({position:0})])),false);
  assert.equal(validateLayout(layout([room()],[door(),door({id:'other',position:.55})])),false);
});
test('saving geometry retains manual areas; transferring areas is explicit and common spaces stay separate',()=>{
  const f=floor(),drawing=layout([room(),room('common',rectPoints(8,0,4,6),{zoneId:undefined,name:'Коридор',nameKk:'Дәліз'})]);
  assert.equal(applyFloorLayout(f,drawing).zones[0].area,240);
  assert.equal(applyFloorLayout(f,drawing,true).zones[0].area,48);
  assert.equal(applyFloorLayout(f,drawing,true).zones.length,1);assert.equal(f.layout,undefined);
  const fresh=applyFloorLayout(f,layout([room('new',rectPoints(0,0,5,4),{zoneId:'new-zone'})]));
  assert.equal(fresh.zones[1].area,0);assert.equal(fresh.zones[1].hazard,'special');
  assert.equal(applyFloorLayout(f,layout([])).zones.length,1,'removing a shape does not delete the calculation zone');
});
test('import and snapshots keep geometry valid, linked and independent of the fire calculation',()=>{
  const b=building();assert.equal(validateBuilding(b),true);b.floors[0]=applyFloorLayout(b.floors[0],layout([room()],[door()]));assert.equal(validateBuilding(b),true);
  const snapshot=calculate(b);assert.equal(snapshot.rows[0].count,2,'the engine still uses 240 m², not the drawn 48 m²');
  b.floors[0].layout.rooms[0].points[0].x=1;assert.equal(snapshot.building.floors[0].layout.rooms[0].points[0].x,0);assert.equal(validateBuilding(b),false);
  assert.equal(validateLayout(layout([room(),room('r2',rectPoints(8,0,4,6))])),false,'a zone cannot be counted twice through multiple shapes');
  assert.equal(validateLayout(layout(),new Set(['other'])),false);
});
test('standalone SVG exports escape user labels instead of interpreting markup',()=>{
  const svg=layoutSVG(layout([room('r',rectPoints(0,0,8,6),{name:'<script>alert("x")</script> & room'})]),'ru');
  assert.ok(svg.includes('&lt;script&gt;'));assert.ok(svg.includes('&amp; room'));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('48 м²'));
});
