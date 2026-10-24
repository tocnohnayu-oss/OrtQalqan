import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { createShowcase } from '../src/data/showcase.mjs';

/** Render real app states for visual review, including adversarial names and compact viewports. */
export async function identityReview(browser,errors){
  const names={education:['Учебное заведение','Оқу орны'],office:['Офис','Кеңсе'],retail:['Магазин','Дүкен'],warehouse:['Склад','Қойма'],industrial:['Производство','Өндіріс'],other:['Другой объект','Басқа нысан']},drawings=[];
  for(const kind of Object.keys(names)){
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const building=createShowcase({id:'identity-'+kind});building.kind=kind;building.usage=['education','office','retail'].includes(kind)?'public':'unknown';building.name=names[kind][0];building.nameKk=names[kind][1];delete building.floors[0].layout;building.floors[0].zones=[];
    try{
      await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'the object masthead fits the desktop');
      drawings.push({svg:await page.locator('.object-sketch').evaluate(svg=>svg.outerHTML),names:names[kind]});
      if(kind==='warehouse')await page.screenshot({path:'qa/identity-empty-desktop.png',fullPage:true});
      if(kind==='education'){
        await page.setViewportSize({width:320,height:844});await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'the new empty composition fits the narrow phone');await page.screenshot({path:'qa/identity-empty-mobile-kk.png',fullPage:true});
      }
    }catch(error){await page.screenshot({path:'qa/identity-failure.png',fullPage:true}).catch(()=>{});throw error;}
    finally{await context.close();}
  }
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  try{
    const building=createShowcase({id:'identity-plan'});building.name='Учебный корпус · пример';building.nameKk='Петропавл қаласындағы оқу, зертханалық және әкімшілік бөлмелері бар оқу корпусы · мысал';
    await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'qa/identity-plan-desktop.png',fullPage:true});
    await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.locator('.studio-zone-list').getByRole('button',{name:'Кітапхана',exact:true}).click();await page.setViewportSize({width:1024,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'long Kazakh object names and the open inspector fit a tablet');const layout=await page.locator('.studio-layout').boundingBox(),plan=await page.locator('.studio-plan').boundingBox(),inspector=await page.locator('.simple-inspector').boundingBox();assert.ok(Math.abs(plan.x+plan.width-(layout.x+layout.width-1))<2,'the tablet plan uses the full remaining width');assert.ok(inspector.y>=plan.y+plan.height-2&&Math.abs(inspector.width-(layout.width-2))<2,'tablet parameters form a full-width folio under the plan');await expect(page.getByRole('button',{name:'Нысанды есептеу',exact:true})).toBeVisible();await page.screenshot({path:'qa/identity-tablet-kk.png',fullPage:true});
    await page.setViewportSize({width:320,height:844});await page.locator('.studio-zone-list').getByRole('button',{name:'Кітапхана',exact:true}).click();await expect(page.locator('.inspector-sheet')).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'the branded parameter sheet fits the phone');await page.screenshot({path:'qa/identity-params-mobile-kk.png',fullPage:false});await page.locator('.inspector-sheet .modal-heading button').click();
    await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'qa/identity-long-title-mobile-kk.png',fullPage:true});
    const controls=await page.locator('.studio-actions .button').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};}));assert.ok(controls.every(r=>r.left>=0&&r.right<=320&&r.height>=44),'calculation and PDF stay reachable with long titles');
    const gallery=await context.newPage();await gallery.setViewportSize({width:1000,height:560});
    await gallery.setContent(`<html lang="ru"><head><style>*{box-sizing:border-box}body{margin:0;padding:36px;background:#eae8e1;color:#253b42;font:16px Arial,sans-serif}h1{font-size:24px;margin:0 0 24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#bac5b6;border:1px solid #bac5b6}section{background:#fffdf8;display:flex;align-items:center;gap:18px;padding:20px}svg{width:100px;height:100px;flex-shrink:0}strong{display:block;font-size:17px}small{display:block;color:#627260;margin-top:8px;font-size:13px}</style></head><body><h1>OrtQalqan · типы объектов / нысан түрлері</h1><main>${drawings.map(item=>`<section>${item.svg}<div><strong>${item.names[0]}</strong><small>${item.names[1]}</small></div></section>`).join('')}</main></body></html>`);await gallery.screenshot({path:'qa/identity-types.png',fullPage:true});await gallery.close();
    assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/identity-failure.png',fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();}
}
