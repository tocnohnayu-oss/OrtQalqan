import test from 'node:test';
import assert from 'node:assert/strict';
import {createAtlasShowcase} from '../data/atlas-showcase.mjs';
import {captureModelSession,restoreModelSession,modelLocation,validModelCamera} from './model-session.mjs';
const camera={position:[30,20,40],target:[10,3,5],aspect:1.8,near:.05,far:1000,minDistance:1,maxDistance:600,focusZone:''};
const view=building=>({floorId:building.floors[0].id,zoneId:building.floors[0].zones[0].id,cut:true,height:3.4,labelsOn:false,expanded:true,camera});
test('a session restores the exact camera after source parameter edits without copying or editing Building',()=>{
  const building=createAtlasShowcase({id:'session'}),original=structuredClone(building),saved=captureModelSession(building,view(building));
  building.floors[0].zones[0].area=401;building.revision++;const restored=restoreModelSession(building,saved,building.floors[0].id);
  assert.deepEqual(restored.camera,camera);assert.equal(restored.height,3.4);assert.equal(restored.labelsOn,false);assert.equal(restored.expanded,true);
  assert.equal(saved.buildingId,original.id);assert.equal('building' in saved,false);restored.camera.position[0]=99;assert.equal(saved.camera.position[0],30);assert.deepEqual(camera.position,[30,20,40]);
});
test('another object cannot inherit a camera or selected room, even with identical floor IDs',()=>{
  const building=createAtlasShowcase({id:'session'}),saved=captureModelSession(building,view(building)),other=structuredClone(building);other.id='another';
  const restored=restoreModelSession(other,saved,other.floors[0].id);assert.equal(restored.camera,null);assert.equal(restored.zoneId,'');assert.equal(restored.expanded,false);assert.equal(restored.height,3);
});
test('edited contours or a different floor invalidate the camera while retaining valid view settings',()=>{
  const building=createAtlasShowcase({id:'session'}),saved=captureModelSession(building,view(building));building.floors[0].layout.rooms[0].points[0].x+=.25;
  assert.equal(restoreModelSession(building,saved,building.floors[0].id).camera,null);
  const other=restoreModelSession(building,saved,building.floors[1].id);assert.equal(other.camera,null);assert.equal(other.zoneId,'');assert.equal(other.cut,true);
});
test('invalid camera numbers and unknown selections are discarded',()=>{
  const building=createAtlasShowcase({id:'session'}),saved=captureModelSession(building,view(building));saved.zoneId='missing';saved.camera.position[0]=NaN;
  const restored=restoreModelSession(building,saved,building.floors[0].id);assert.equal(restored.camera,null);assert.equal(restored.zoneId,'');
  assert.equal(validModelCamera({...camera,near:2000}),false);assert.equal(validModelCamera({...camera,target:[1,2]}),false);
});
test('3D source locations use exact zone IDs and actual contours, never image markers',()=>{
  const building=createAtlasShowcase({id:'session'}),floor=building.floors[0],zone=floor.zones[0];assert.deepEqual(modelLocation(building,zone.id),{floorId:floor.id,zoneId:zone.id});
  floor.layout.rooms=floor.layout.rooms.filter(room=>room.zoneId!==zone.id);floor.plan='image';floor.markers=[{id:'mark',zoneId:zone.id,x:.5,y:.5,type:'OP'}];assert.equal(modelLocation(building,zone.id),null);assert.equal(modelLocation(building,'missing'),null);
});
