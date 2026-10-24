import { expect } from '@playwright/test';
import assert from 'node:assert/strict';

export async function guideSmoke(browser,errors){
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  const guide=page.locator('.quick-guide');
  try{
    await page.goto('http://127.0.0.1:4173');
    await expect(guide.getByRole('heading',{name:'Освойте OrtQalqan за минуту',exact:true})).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'qa/guide-welcome.png',fullPage:false});
    await guide.getByRole('button',{name:'Начать экскурс',exact:true}).click();
    await expect(guide.getByRole('heading')).toHaveText('Выберите объект');
    await guide.getByRole('button',{name:'Далее',exact:true}).click();
    await expect(guide.getByRole('heading')).toHaveText('Соберите план этажа');await page.screenshot({path:'qa/guide-desktop.png',fullPage:false});
    for(const title of ['Проведите обход','Рассчитайте и скачайте отчёт','Сохраните работу для команды']){await guide.getByRole('button',{name:'Далее',exact:true}).click();await expect(guide.getByRole('heading')).toHaveText(title);}
    await guide.getByRole('button',{name:'Начать работу',exact:true}).click();await expect(guide).toHaveCount(0);
    await page.reload();await expect(page.getByRole('heading',{name:'НИШ ЕМН · Петропавловск',exact:true})).toBeVisible();assert.equal(await guide.count(),0,'the welcome is offered once on this device');
    await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.setViewportSize({width:320,height:720});
    await page.getByRole('button',{name:'Нұсқаулық',exact:true}).click();
    await expect(guide.getByRole('heading')).toHaveText('Нысанды таңдаңыз');await page.screenshot({path:'qa/guide-mobile-kk.png',fullPage:false});
    for(let n=0;n<5;n++){
      const card=await guide.locator('.guide-card').boundingBox();assert.ok(card.x>=0&&card.y>=0&&card.x+card.width<=320&&card.y+card.height<=720,'the instructional card remains readable on a narrow phone');
      const target=await page.locator(`[data-guide="${['objects','plan','walk','results','account'][n]}"]`).boundingBox();
      assert.ok(card.x+card.width<=target.x||target.x+target.width<=card.x||card.y+card.height<=target.y||target.y+target.height<=card.y,'the guide never covers the control it explains');
      if(n===1)await page.screenshot({path:'qa/guide-mobile-plan-kk.png',fullPage:false});
      if(n<4)await guide.getByRole('button',{name:'Келесі',exact:true}).click();
    }
    await guide.getByRole('button',{name:'Жұмысты бастау',exact:true}).click();
    await page.getByRole('button',{name:'Нұсқаулық',exact:true}).click();await guide.press('Escape');await expect(guide).toHaveCount(0);
    assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'','closing the guide restores normal page scrolling');
    const skip=await context.newPage();await skip.goto('http://127.0.0.1:4173');assert.equal(await skip.locator('.quick-guide').count(),0);await skip.close();
    assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/guide-failure.png',fullPage:false});throw error;}
  finally{await context.close();}
  const fresh=await browser.newContext({viewport:{width:390,height:844}}),skip=await fresh.newPage();
  try{await skip.goto('http://127.0.0.1:4173');await skip.locator('.quick-guide').getByRole('button',{name:'Позже',exact:true}).click();await skip.reload();await expect(skip.getByRole('heading',{name:'НИШ ЕМН · Петропавловск',exact:true})).toBeVisible();assert.equal(await skip.locator('.quick-guide').count(),0,'the welcome can be skipped without repeating');}
  finally{await fresh.close();}
}
