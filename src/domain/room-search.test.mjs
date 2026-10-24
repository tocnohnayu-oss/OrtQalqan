import test from 'node:test';
import assert from 'node:assert/strict';
import { createShowcase } from '../data/showcase.mjs';
import { findRooms } from './room-search.mjs';
import { nextInspection, resumeInspection } from './inspection.mjs';

const fixture=()=>{
  const building=createShowcase({id:'search'}),second=createShowcase({id:'upper'}).floors[0];second.name='Второй этаж';second.nameKk='Екінші қабат';building.floors.push(second);return building;
};
test('room search crosses floors, accepts either language and combines floor and room terms',()=>{
  const building=fixture();assert.equal(findRooms(building,'  КІТАПХАНА  ').length,2);
  assert.equal(findRooms(building,'екінші КІТАПХАНА')[0].zone.id,'upper-library');
  assert.equal(findRooms(building,'серверная второй')[0].zone.id,'upper-server');
  assert.equal(findRooms(building,'Бірінші')[0].floor.id,'search-floor');
  assert.equal(findRooms(building,'не существующее').length,0);
});
test('equipment matches identify the record without losing duplicate serial numbers on other floors',()=>{
  const building=fixture(),matches=findRooms(building,'demo–01');
  assert.equal(matches.length,2);assert.equal(matches[0].matchedAssets[0].id,'search-asset');assert.equal(matches[1].matchedAssets[0].id,'upper-asset');
  assert.equal(findRooms(building,'екінші demo-01')[0].zone.id,'upper-library');
  assert.equal(findRooms(building,'учебная запись')[0].matchedAssets[0].label,'DEMO-01');
  assert.equal(findRooms(building,'Библиотека')[0].matchedAssets.length,0,'a room-name match opens the room, not an arbitrary asset');
});
test('search normalizes fullwidth digits and Russian ё without dropping Kazakh distinctions',()=>{
  const building=fixture();building.floors[0].zones[0].name='Трёхмерный зал 101';building.floors[0].zones[0].nameKk='Әдістемелік бөлме';
  assert.equal(findRooms(building,'трехмерный １０１')[0].zone.id,'search-library');
  assert.equal(findRooms(building,'Әдістемелік').length,1);assert.equal(findRooms(building,'Адістемелік').length,0);
});
test('an empty building or unmatched search has no fabricated room or equipment',()=>{
  const building=fixture();assert.equal(findRooms(building,'unknown-serial').length,0);
  building.floors[0].zones=[];building.floors[1].zones=[];
  assert.deepEqual(findRooms(building,''),[]);assert.equal(resumeInspection([],building.date),undefined);assert.equal(nextInspection([],'none',building.date),undefined);
});
test('resume prefers explicit selection, then unfinished answers, and skips finished records for the inspection date',()=>{
  const building=fixture(),[done,pending,started]=building.floors[0].zones;
  done.inspection={access:'ok',marking:'ok',passport:'ok',checkedOn:building.date};started.inspection={access:'ok',marking:'unknown',passport:'unknown'};
  const entries=findRooms(building);
  assert.equal(resumeInspection(entries,building.date).zone.id,started.id);
  assert.equal(resumeInspection(entries,building.date,done.id).zone.id,done.id);
  delete started.inspection;assert.equal(resumeInspection(entries,building.date,'removed').zone.id,pending.id);
});
test('next inspection follows only matching rooms, wraps pending work and does not select itself',()=>{
  const building=fixture(),entries=findRooms(building),matches=findRooms(building,'кітапхана');
  assert.equal(nextInspection(entries,'search-library',building.date,'all',matches).zone.id,'upper-library');
  assert.equal(nextInspection(entries,'upper-library',building.date,'pending',matches).zone.id,'search-library');
  assert.equal(nextInspection(entries,'search-library',building.date,'all',matches.slice(0,1)),undefined);
  assert.equal(nextInspection(entries,'search-library',building.date,'all',[]),undefined);
});
test('attention review includes finished rooms with issues and stops at the end instead of cycling',()=>{
  const building=fixture(),done={access:'ok',marking:'attention',passport:'ok',checkedOn:building.date};
  building.floors[0].zones[1].inspection={...done};building.floors[1].zones[1].inspection={...done};
  const entries=findRooms(building),matches=findRooms(building,'Сынып');
  assert.equal(nextInspection(entries,'search-classroom',building.date,'attention',matches).zone.id,'upper-classroom');
  assert.equal(nextInspection(entries,'upper-classroom',building.date,'attention',matches),undefined);
  assert.equal(nextInspection(entries,'search-classroom',building.date,'pending',matches),undefined);
});
test('earlier-date inspections do not become completed work on a new date',()=>{
  const building=fixture();building.floors[0].zones[1].inspection={access:'ok',marking:'ok',passport:'ok',checkedOn:'2026-10-23'};
  assert.equal(resumeInspection(findRooms(building),'2026-10-24').zone.id,'search-classroom');
});
