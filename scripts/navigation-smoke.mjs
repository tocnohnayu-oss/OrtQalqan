import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { createShowcase } from '../src/data/showcase.mjs';

export async function navigationSmoke(browser,errors){
  const building=createShowcase({id:'camera-demo'}),upper=createShowcase({id:'camera-upper'}).floors[0];
  upper.name='Второй этаж';upper.nameKk='Екінші қабат';building.floors.push(upper);
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);
  const svg=page.locator('.built-floor-plan'),footer=page.locator('.plan-view-footer');
  const camera=()=>svg.getAttribute('viewBox');
  const world=point=>svg.evaluate((svg,point)=>{const p=new DOMPoint(point.x,point.y).matrixTransform(svg.getScreenCTM().inverse());return {x:p.x,y:p.y};},point);
  try{
    await page.goto('http://127.0.0.1:4173');await svg.waitFor();
    const initial=await camera();await footer.getByRole('button',{name:'Приблизить план',exact:true}).click();
    await svg.scrollIntoViewIfNeeded();const box=await svg.boundingBox(),a={x:box.x+box.width*.4,y:box.y+box.height*.5};
    await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(a.x+65,a.y+30,{steps:8});await page.mouse.up();
    const panned=await camera();assert.notEqual(panned,initial);assert.equal(await page.locator('#zone-inspector').count(),0,'dragging over a room never opens its parameters');
    await svg.focus();await page.keyboard.press('ArrowRight');assert.notEqual(await camera(),panned);await page.keyboard.press('0');assert.equal(await camera(),initial);
    const b=await svg.boundingBox(),anchor={x:b.x+b.width*.6,y:b.y+b.height*.45},before=await world(anchor);
    await page.mouse.move(anchor.x,anchor.y);await page.keyboard.down('Control');await page.mouse.wheel(0,-180);await page.keyboard.up('Control');
    await expect.poll(camera).not.toBe(initial);const after=await world(anchor);assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.02,'wheel zoom keeps the pointed room anchored');
    await footer.getByRole('button',{name:'ОП / ОУ на плане',exact:true}).click();await expect(svg.locator('.plan-count')).toHaveCount(3);await expect(svg.locator('.plan-count-manual')).toHaveCount(1);
    await page.screenshot({path:'qa/navigation-desktop.png',fullPage:true});
    await page.getByRole('button',{name:'Рассчитать объект',exact:true}).click();
    await page.locator('.calculation-proof').getByRole('button',{name:'Параметры помещения: Серверная',exact:true}).last().click();
    await expect(page.locator('.studio-floor.active')).toContainText('Второй этаж');await expect(page.locator('[data-zone-area]')).toBeFocused();
    await page.locator('[data-zone-area]').fill('401');
    await expect(svg.locator('.plan-count')).toHaveCount(0);await expect(footer).toContainText('Обновите расчёт');
    await page.locator('.compact-result').click();assert.ok(await page.locator('.proof-edit-zone:disabled').count()>0,'stale snapshots cannot edit old zone identities');await page.locator('dialog .modal-heading button').click();
    await page.locator('.simple-inspector-heading button').click();
    await page.setViewportSize({width:320,height:900});await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();
    await footer.getByRole('button',{name:'Жоспарды толық көрсету',exact:true}).click();await svg.scrollIntoViewIfNeeded();
    const mobileInitial=await camera(),m=await svg.boundingBox(),cx=m.x+m.width/2,cy=m.y+m.height/2;
    const cdp=await context.newCDPSession(page),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((point,id)=>({...point,id,radiusX:3,radiusY:3,force:1}))});
    await touch('touchStart',[{x:cx-35,y:cy},{x:cx+35,y:cy}]);
    for(let i=1;i<=5;i++)await touch('touchMove',[{x:cx-35-i*8,y:cy+i*2},{x:cx+35+i*8,y:cy+i*2}]);
    await touch('touchEnd',[]);await expect.poll(camera).not.toBe(mobileInitial);assert.equal(await page.locator('.inspector-sheet').count(),0,'pinching is never a room tap');
    const beforePan=await camera();await touch('touchStart',[{x:cx,y:cy}]);await touch('touchMove',[{x:cx+35,y:cy+30}]);await touch('touchEnd',[]);await expect.poll(camera).not.toBe(beforePan);
    await footer.getByRole('button',{name:'Жоспарды толық көрсету',exact:true}).click();
    const room=svg.locator('[data-room-id="camera-upper-room-classroom"]');await room.tap();await expect(page.locator('.inspector-sheet')).toBeVisible();await expect(page.locator('[data-zone-area]')).toHaveValue('48');await page.locator('.inspector-sheet .modal-heading button').click();
    await page.getByRole('button',{name:'Нысанды қайта есептеу',exact:true}).click();await page.locator('.calculation-proof').getByRole('button',{name:'Бөлме параметрлері: Сервер бөлмесі',exact:true}).last().click();await expect(page.locator('[data-zone-area]')).toBeFocused();await expect(page.locator('[data-zone-area]')).toHaveValue('401');await page.locator('.inspector-sheet .modal-heading button').click();
    await footer.scrollIntoViewIfNeeded();await expect(footer.getByRole('button',{name:'Жоспардағы ОП / ОУ',exact:true})).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const controls=await footer.locator('button').evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};}));assert.ok(controls.every(r=>r.left>=0&&r.right<=320&&r.width>=44&&r.height>=44),'every phone plan control fits and has a 44px target');
    await page.screenshot({path:'qa/navigation-mobile-kk.png',fullPage:true});
    assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/navigation-failure.png',fullPage:true}).catch(()=>{});throw error;}
  finally{await context.close();}
}
