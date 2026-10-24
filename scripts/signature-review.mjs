import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { createShowcase } from '../src/data/showcase.mjs';
import { ROOM_PRESETS } from '../src/domain/room-presets.mjs';
import { rectPoints } from '../src/domain/layout.mjs';
import { validateBuilding } from '../src/domain/calculator.mjs';

export async function signatureReview(browser,errors){
  const building=createShowcase({id:'signature-review',date:'2026-10-25'}),context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');if(!localStorage.getItem('ortqalqan.building.v1'))localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);
  const load=async building=>{assert.equal(validateBuilding(building),true);await page.evaluate(building=>localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]})),building);await page.reload();await page.evaluate(()=>document.fonts.ready);};
  const contrast=async selector=>{
    const ratio=await page.locator(selector).first().evaluate(element=>{
      const rgb=color=>color.match(/[\d.]+/g).map(Number),luminance=channels=>channels.slice(0,3).map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
      let parent=element,bg;while(parent){const color=rgb(getComputedStyle(parent).backgroundColor);if(color.length===3||color[3]===1){bg=color;break;}parent=parent.parentElement;}
      const a=luminance(rgb(getComputedStyle(element).color)),b=luminance(bg||[255,255,255]);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    });assert.ok(ratio>=4.5,`${selector} keeps at least 4.5:1 text contrast (actual ${ratio.toFixed(2)})`);
  };
  try{
    await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.studio-zone-list .room-glyph')).toHaveCount(4);await contrast('.studio-floor.active strong');await contrast('.studio-zone-list .room-index-name');await contrast('.room-index-scope');await page.screenshot({path:'qa/signature-desktop.png',fullPage:true});
    await page.locator('.studio-zone-list').getByRole('button',{name:'Класс',exact:true}).click();await contrast('.studio-zone-list .active .room-index-name');await expect(page.locator('[data-zone-area]')).toHaveValue('48');await page.screenshot({path:'qa/signature-room-desktop.png',fullPage:true});await page.locator('.simple-inspector-heading button').click();
    const input=page.getByRole('searchbox',{name:'Найти помещение или оборудование',exact:true});await input.fill('сервер');await contrast('.room-index-match strong');await expect(page.locator('.room-index-match')).toHaveCount(1);await page.screenshot({path:'qa/signature-search-desktop.png',fullPage:true});await input.press('Escape');
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings[0]),JSON.parse(JSON.stringify(building)),'visual navigation never alters source data');
    await page.setViewportSize({width:320,height:844});await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.emulateMedia({colorScheme:'dark'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');await contrast('.studio-floor.active strong');await contrast('.studio-zone-list .room-index-name');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'qa/signature-mobile-kk.png',fullPage:true});
    const empty=structuredClone(building);empty.kind='warehouse';empty.usage='storage';empty.name='Склад · учебный пример';empty.nameKk='Қойма · оқу мысалы';delete empty.floors[0].layout;empty.floors[0].zones=[];await load(empty);await page.screenshot({path:'qa/signature-empty-mobile-kk.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'RU',exact:true}).click();await page.screenshot({path:'qa/signature-empty-desktop.png',fullPage:true});
    // Collect the symbols from a real, validated synthetic object; this gallery is a QA artifact.
    const symbols=structuredClone(building),floor=symbols.floors[0],presets=Object.entries(ROOM_PRESETS);floor.zones=presets.map(([preset,kit],index)=>({...building.floors[0].zones[3],id:`glyph-zone-${index}`,name:kit.name,nameKk:kit.nameKk,area:0,assets:[]}));floor.layout={version:1,rooms:presets.map(([preset,kit],index)=>({id:`glyph-room-${index}`,zoneId:floor.zones[index].id,name:kit.name,nameKk:kit.nameKk,preset,points:rectPoints(index%5*30,Math.floor(index/5)*30,kit.width,kit.height)})),openings:[]};await load(symbols);
    const glyphs=await page.locator('.studio-zone-list>.room-index-room').evaluateAll(buttons=>buttons.map(button=>({svg:button.querySelector('svg').outerHTML,name:button.textContent})));assert.equal(glyphs.length,presets.length);
    const gallery=await context.newPage();await gallery.setViewportSize({width:1000,height:880});await gallery.setContent(`<html lang="ru"><head><style>*{box-sizing:border-box}body{margin:0;background:#ebede7;color:#253b42;font:14px Arial,sans-serif;padding:32px}h1{font-size:26px;margin:0 0 9px}p{margin:0 0 28px;color:#53695b}main{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border:1px solid #bcc8b8;background:#bcc8b8}section{background:#fffdf8;display:flex;align-items:center;gap:16px;min-height:105px;padding:16px}svg{width:48px;height:48px;flex-shrink:0}.room-glyph-accent{stroke:#b5452b}strong{font-weight:500}</style></head><body><h1>OrtQalqan · обозначения помещений</h1><p>Символы выбранных блоков. Не план, не инвентаризация.</p><main>${glyphs.map(item=>`<section>${item.svg}<strong>${item.name}</strong></section>`).join('')}</main></body></html>`);await gallery.screenshot({path:'qa/signature-symbols.png',fullPage:true});await gallery.close();assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/signature-failure.png',fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();}
}
