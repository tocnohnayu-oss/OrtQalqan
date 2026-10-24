import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placePlanLabels, wrapPlanText } from './plan-labels.mjs';
import { labelBounds, labelPoint, layoutBounds } from './layout.mjs';
import { createShowcase } from '../data/showcase.mjs';

const floor=createShowcase({id:'labels'}).floors[0],items=floor.layout.rooms.map(room=>({id:room.id,name:room.nameKk,detail:'48 м²',center:labelPoint(room.points),bounds:labelBounds(room.points),priority:room.zoneId?1:0}));
const view=layoutBounds(floor.layout),overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
test('room labels retain readable screen sizes at overview, close zoom and narrow widths',()=>{
  const before=structuredClone(items);
  for(const viewport of [{width:1440,height:900},{width:320,height:500},{width:320,height:200}]){
    const result=placePlanLabels(items,view,viewport);assert.ok(result.labels.length>0);
    for(const label of result.labels){assert.ok(label.size>=14&&label.detailSize>=12);assert.ok(label.x>=0&&label.y>=0&&label.x+label.width<=viewport.width&&label.y+label.height<=viewport.height);for(const other of result.labels)if(other.id!==label.id)assert.equal(overlap(label,other),false);}
  }
  const close=placePlanLabels(items,{x:21,y:-1,width:10,height:9},{width:320,height:500});assert.ok(close.labels.some(label=>label.id.endsWith('classroom')));assert.deepEqual(items,before);
});
test('letterboxed cameras attach callouts to the actual room centre',()=>{
  const [item]=items,result=placePlanLabels([item],view,{width:320,height:800}),label=result.labels[0];
  assert.ok(result.offsetY>0);assert.equal(label.anchor.x,result.offsetX+(item.center.x-view.x)*result.scale);assert.equal(label.anchor.y,result.offsetY+(item.center.y-view.y)*result.scale);
});
test('crowded plans prioritise the selected room without shrinking or overlapping labels',()=>{
  const dense=Array.from({length:100},(_,index)=>({id:String(index),name:'Сервер бөлмесі '+index,detail:'4 м²',center:{x:5+index%10*.2,y:5+Math.floor(index/10)*.2},bounds:{x:5,y:5,width:.2,height:.2},priority:index===99?10:1}));
  const result=placePlanLabels(dense,{x:0,y:0,width:12,height:12},{width:320,height:240});assert.ok(result.hidden>0);assert.equal(result.labels[0].id,'99');assert.equal(new Set(result.labels.map(label=>label.id)).size,result.labels.length);
  for(const label of result.labels)for(const other of result.labels)if(other.id!==label.id)assert.equal(overlap(label,other),false);
});
test('wrapping keeps Kazakh text, bounds long labels and marks the shortened end',()=>{
  const measure=text=>Array.from(text).length*7;
  assert.deepEqual(wrapPlanText('Сервер бөлмесі',63,measure).lines,['Сервер','бөлмесі']);
  const long=wrapPlanText('ӘҒҚҢӨҰҮҺІ '.repeat(30),70,measure);assert.equal(long.lines.length,2);assert.equal(long.truncated,true);assert.ok(long.lines[1].endsWith('…'));assert.ok(long.lines.every(line=>measure(line)<=70));
});
