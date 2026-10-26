import test from 'node:test';
import assert from 'node:assert/strict';
import {placeModelLabels} from './model-labels.mjs';

test('3D names stay within a phone viewport, never overlap and preserve projected sources',()=>{
  const items=Array.from({length:30},(_,i)=>({id:String(i),name:'Кітапхана · Ә Ғ Қ Ң Ө Ұ Ү Һ І '+i,x:24+i%5*60,y:45+Math.floor(i/5)*48,depth:.5,priority:i%3}));
  const original=structuredClone(items),{labels,hidden}=placeModelLabels(items,{width:320,height:350});
  assert.ok(labels.length>1);assert.equal(labels.length+hidden,30);assert.deepEqual(items,original);
  for(const a of labels){assert.ok(a.x>=12&&a.x+a.width<=308&&a.y>=12&&a.y+a.height<=338);for(const b of labels)if(a!==b)assert.ok(a.x+a.width+6<=b.x||b.x+b.width+6<=a.x||a.y+a.height+6<=b.y||b.y+b.height+6<=a.y);}
});
test('the selected room keeps its label when a dense view has room for only one',()=>{
  const items=[{id:'attention',name:'Библиотека',x:80,y:60,depth:.1,priority:5},{id:'selected',name:'Серверная',x:80,y:60,depth:.9,priority:0}];
  const result=placeModelLabels(items,{width:160,height:110},'selected');
  assert.deepEqual(result.labels.map(label=>label.id),['selected']);assert.equal(result.hidden,1);
});
test('points behind the camera or outside the canvas do not create misleading labels',()=>{
  const items=[{id:'good',name:'Класс',x:160,y:120,depth:.5},...[-2,2,NaN].map((depth,i)=>({id:'depth'+i,name:'Нет',x:160,y:120,depth})),{id:'off',name:'Нет',x:-40,y:80,depth:.5}];
  assert.deepEqual(placeModelLabels(items,{width:320,height:350}).labels.map(label=>label.id),['good']);
  assert.deepEqual(placeModelLabels(items,{width:0,height:0}),{labels:[],hidden:5});
});
test('a dense building has a bounded label budget while all rooms remain in the source',()=>{
  const items=Array.from({length:100},(_,i)=>({id:String(i),name:'Класс '+i,x:40+i%10*90,y:40+Math.floor(i/10)*55,depth:.4}));
  const result=placeModelLabels(items,{width:1000,height:600});assert.ok(result.labels.length<=32);assert.equal(result.labels.length+result.hidden,100);
});
