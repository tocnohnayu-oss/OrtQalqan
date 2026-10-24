import assert from 'node:assert/strict';
import test from 'node:test';
import { navigateView, screenPoint } from './view-navigation.mjs';

const near=(a,b)=>{assert.ok(Math.abs(a.x-b.x)<1e-8);assert.ok(Math.abs(a.y-b.y)<1e-8);};
test('pan keeps a room under the pointer in portrait and landscape SVG letterboxing',()=>{
  for(const rect of [{left:23,top:70,width:320,height:450},{left:90,top:10,width:1100,height:400}]){
    const view={x:-2,y:4,width:34,height:24},start={x:170,y:200},end={x:220,y:265};
    const next=navigateView(view,rect,start,end);
    near(screenPoint(view,rect,start),screenPoint(next,rect,end));
    assert.equal(next.width,view.width);assert.equal(next.height,view.height);
  }
});
test('pinch moves and zooms about its midpoint without changing the aspect ratio',()=>{
  const view={x:-5,y:-3,width:34,height:24},rect={left:10,top:120,width:320,height:390};
  const start={x:130,y:300},end={x:160,y:310},next=navigateView(view,rect,start,end,.4);
  near(screenPoint(view,rect,start),screenPoint(next,rect,end));
  assert.ok(Math.abs(next.width-13.6)<1e-8);assert.ok(Math.abs(next.width/next.height-view.width/view.height)<1e-10);
});
test('zoom limits preserve anchor and proportions at both extremes',()=>{
  const view={x:1,y:2,width:34,height:24},rect={left:0,top:0,width:500,height:400},anchor={x:170,y:240};
  for(const factor of [1e-8,1e8]){
    const next=navigateView(view,rect,anchor,anchor,factor);
    assert.ok(next.width>=4&&next.height>=3&&next.width<=480&&next.height<=480);
    assert.ok(Math.abs(next.width/next.height-view.width/view.height)<1e-10);
    near(screenPoint(view,rect,anchor),screenPoint(next,rect,anchor));
  }
});
test('invalid gestures and a hidden canvas leave the camera unchanged',()=>{
  const view={x:0,y:0,width:20,height:10},point={x:10,y:10};
  for(const ratio of [0,-1,NaN,Infinity])assert.equal(navigateView(view,{left:0,top:0,width:320,height:390},point,point,ratio),view);
  assert.equal(navigateView(view,{left:0,top:0,width:0,height:0},point,point,.5),view);
});
