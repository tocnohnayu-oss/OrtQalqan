import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { createShowcase } from '../src/data/showcase.mjs';
import { rectPoints } from '../src/domain/layout.mjs';
import { validateBuilding } from '../src/domain/calculator.mjs';

export async function labelsSmoke(browser,errors){
  const building=createShowcase({id:'readable-plan'}),context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');if(!localStorage.getItem('ortqalqan.building.v1'))localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);
  const svg=page.locator('.built-floor-plan');
  const readable=async target=>{
    await expect(target.locator('.plan-label')).not.toHaveCount(0);
    const result=await target.evaluate(svg=>{
      const area=svg.getBoundingClientRect(),boxes=[...svg.querySelectorAll('.plan-label-paper')].map(node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};});
      const text=[...svg.querySelectorAll('.plan-room-name,.plan-room-detail')].map(node=>({name:node.classList.contains('plan-room-name'),size:parseFloat(getComputedStyle(node).fontSize)*Math.hypot(node.getScreenCTM().a,node.getScreenCTM().b)}));
      return {text,inside:boxes.every(b=>b.x>=area.x-1&&b.y>=area.y-1&&b.right<=area.right+1&&b.bottom<=area.bottom+1),overlap:boxes.some((a,i)=>boxes.some((b,j)=>i!==j&&a.x<b.right-1&&a.right>b.x+1&&a.y<b.bottom-1&&a.bottom>b.y+1))};
    });
    assert.ok(result.text.every(t=>t.size>=(t.name?13.9:11.9)),'the actual transformed text stays readable, including SVG letterboxing');assert.equal(result.inside,true);assert.equal(result.overlap,false,'visible nameplates never overlap');
  };
  try{
    await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);await expect(svg.locator('.plan-label')).toHaveCount(5);await readable(svg);
    await page.getByRole('button',{name:'ОП / ОУ на плане',exact:true}).click();await expect(svg.locator('.plan-count')).toHaveCount(3);await page.screenshot({path:'qa/labels-desktop.png',fullPage:true});
    await svg.focus();await page.keyboard.press('-');await readable(svg);await page.keyboard.press('0');assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings[0]),JSON.parse(JSON.stringify(building)),'typography never writes source geometry or fire data');
    await page.setViewportSize({width:320,height:844});await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.getByRole('button',{name:'Жоспарды кеңейту',exact:true}).click();await readable(svg);await page.screenshot({path:'qa/labels-mobile-kk.png',fullPage:false});
    const callout=svg.locator('.plan-label.is-callout').first(),id=await callout.getAttribute('data-room-id'),room=building.floors[0].layout.rooms.find(room=>room.id===id);
    await callout.locator('.plan-label-paper').tap();await expect(page.locator('.inspector-sheet')).toBeVisible();await expect(page.locator('.zone-title h3')).toHaveText(room.nameKk);await page.locator('.inspector-sheet .modal-heading button').click();await readable(svg);await page.screenshot({path:'qa/labels-selected-mobile-kk.png',fullPage:false});
    await page.getByRole('button',{name:'Жоспарды өңдеу',exact:true}).click();const editor=page.locator('.floor-editor-svg');await readable(editor);await page.getByRole('button',{name:'Блок қосу: Сынып',exact:true}).locator('strong').tap();await page.getByRole('button',{name:'Оңға 90° бұру',exact:true}).tap();await readable(editor);await page.screenshot({path:'qa/labels-editor-mobile-kk.png',fullPage:false});page.once('dialog',dialog=>dialog.accept());await page.keyboard.press('Escape');await page.getByRole('button',{name:'Нысанға',exact:true}).click();
    // Dense floors show a zoom hint rather than reducing type or piling labels up.
    const dense=structuredClone(building),floor=dense.floors[0];floor.zones=Array.from({length:60},(_,index)=>({...floor.zones[0],id:`dense-zone-${index}`,name:`Кабинет ${index+1}`,nameKk:`Кабинет ${index+1}`,area:4,assets:[]}));floor.layout={version:1,rooms:floor.zones.map((zone,index)=>({id:`dense-room-${index}`,zoneId:zone.id,name:zone.name,nameKk:zone.nameKk,points:rectPoints(index%10*2,Math.floor(index/10)*2,2,2)})),openings:[]};assert.equal(validateBuilding(dense),true,'dense-floor QA data must pass the normal import validator');
    await page.evaluate(building=>localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]})),dense);await page.reload();await page.getByRole('button',{name:'Жоспарды кеңейту',exact:true}).click();await expect(page.locator('.plan-label-note')).toBeVisible();await readable(svg);await page.screenshot({path:'qa/labels-dense-mobile-kk.png',fullPage:false});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/labels-failure.png',fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();}
}
