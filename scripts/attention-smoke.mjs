import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { createShowcase } from '../src/data/showcase.mjs';
import { validateBuilding } from '../src/domain/calculator.mjs';

export async function attentionSmoke(browser,errors) {
  const building=createShowcase({id:'attention-review',date:'2026-10-25'}),lower=building.floors[0];
  const upper=createShowcase({id:'attention-upper',date:building.date}).floors[0];upper.name='Второй этаж';upper.nameKk='Екінші қабат';building.floors.push(upper);
  for(const f of building.floors)for(const z of f.zones){delete z.inspection;delete z.notes;z.assets=[];}
  lower.zones[0].inspection={access:'attention',marking:'ok',passport:'na',checkedOn:'2026-10-24'};
  lower.zones[0].notes='Освободить подход: коробки у двери. Ә Ғ Қ Ң Ө Ұ Ү Һ І.';
  const asset=(id,label,condition,nextService,type='OP')=>({id,label,model:'Учебная запись · Оқу жазбасы',condition,nextService,type});
  lower.zones[1].assets=[asset('attention-service','DEMO-01','service','2026-10-20')];
  lower.zones[2].assets=[asset('attention-overdue','CO2-02','available','2026-10-22','OU')];
  upper.zones[0].assets=[asset('attention-soon','DEMO-01','available','2026-11-05')];
  upper.zones[1].assets=[asset('attention-verify','DEMO-03','unknown','')];
  const unplaced={...structuredClone(upper.zones[2]),id:'attention-unplaced',name:'Подсобное помещение',nameKk:'Оқу құралдарын сақтауға арналған қосалқы бөлме',assets:[],notes:'Сверить документы. Құжаттарды салыстыру.'};upper.zones.push(unplaced);
  assert.equal(validateBuilding(building),true);
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');if(!localStorage.getItem('ortqalqan.building.v1'))localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);
  const sheet=()=>page.locator('.attention-sheet'),walk=()=>page.locator('.inspection-modal'),link=()=>page.locator('.walk-attention-link');
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings[0]);
  const close=()=>page.locator('dialog[open]>.modal-heading button').click();
  try {
    await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Обход',exact:true}).click();await link().click();await expect(sheet().locator('h3')).toBeFocused();await page.evaluate(()=>document.fonts.ready);
    await expect(sheet().locator('.attention-row')).toHaveCount(6);await expect(sheet().locator('.attention-overdue')).toContainText('2026-10-22');await expect(sheet().locator('.attention-soon')).toContainText('2026-11-05');
    await expect(sheet().locator('[data-attention-id="room:attention-review-library"] .attention-source')).toHaveText('Отметка осмотра на другую дату · 2026-10-24');
    await expect(sheet().locator('[data-attention-id="asset:attention-service"] .attention-reasons')).toContainText('На обслуживании');await expect(sheet().locator('[data-attention-id="asset:attention-service"] .attention-reasons')).toContainText('Дата обслуживания прошла');
    assert.equal(await sheet().locator(`[data-attention-id="room:${unplaced.id}"] .attention-locate`).count(),0,'unplaced observations do not receive a fictional map target');
    await expect.poll(stored).toEqual(building);await page.screenshot({path:'qa/attention-desktop.png',fullPage:false});
    await sheet().getByRole('combobox',{name:'Показать записи',exact:true}).selectOption('overdue');await expect(sheet().locator('.attention-row')).toHaveCount(1);await page.screenshot({path:'qa/attention-dates-desktop.png',fullPage:false});
    const csvEvent=page.waitForEvent('download');await sheet().getByRole('button',{name:'Скачать весь лист CSV',exact:true}).click();await (await csvEvent).saveAs('qa/attention-ru.csv');const csv=await readFile('qa/attention-ru.csv','utf8');assert.match(csv,/CO2-02/);assert.match(csv,/DEMO-03/);assert.match(csv,/Освободить подход/);assert.match(csv,/Подсобное помещение/);assert.match(csv,/2026-10-24/);
    // The asset source opens on the correct floor, read-only, and returning keeps the exact filter and row focus.
    await sheet().getByRole('button',{name:'Открыть оборудование: CO2-02 · Серверная · Первый этаж',exact:true}).click();await expect(walk().locator('.asset-row.is-found .asset-open')).toBeFocused();await expect(walk().locator('.asset-editor')).toHaveCount(0);await expect(walk().locator('.asset-found-location')).toHaveText('Первый этаж · Серверная');
    await link().click();await expect(sheet().getByRole('combobox')).toHaveValue('overdue');await expect(sheet().locator('[data-attention-id="asset:attention-overdue"] .attention-open')).toBeFocused();await expect.poll(stored).toEqual(building);
    await sheet().getByRole('combobox').selectOption('all');await sheet().getByRole('searchbox').fill('DEMO-01');await expect(sheet().locator('.attention-row')).toHaveCount(2);
    await sheet().getByRole('button',{name:'Открыть оборудование: DEMO-01 · Библиотека · Второй этаж',exact:true}).click();await expect(walk().locator('.asset-found-location')).toHaveText('Второй этаж · Библиотека');await expect(walk().locator('.asset-row.is-found .asset-open')).toBeFocused();
    await walk().locator('.asset-row.is-found .asset-open').click();await walk().getByLabel('Инвентарный / серийный номер',{exact:true}).fill('UNSAVED');page.once('dialog',dialog=>dialog.dismiss());await link().click();await expect(walk().locator('.asset-editor')).toBeVisible();await expect(sheet()).not.toBeVisible();await expect(walk().getByLabel('Инвентарный / серийный номер',{exact:true})).toHaveValue('UNSAVED');
    page.once('dialog',dialog=>dialog.accept());await link().click();await expect(sheet().getByRole('searchbox')).toHaveValue('DEMO-01');await expect(sheet().locator('.attention-row')).toHaveCount(2);await expect.poll(stored).toEqual(building);
    await sheet().getByRole('searchbox').fill('нет такого');await expect(sheet().locator('.attention-no-match')).toBeVisible();await sheet().getByRole('button',{name:'Сбросить поиск и фильтр',exact:true}).last().click();await expect(sheet().locator('.attention-row')).toHaveCount(6);
    // A source correction immediately removes that item. There is no independent "resolved" flag.
    await sheet().getByRole('button',{name:'Открыть оборудование: CO2-02 · Серверная · Первый этаж',exact:true}).click();await walk().locator('.asset-row.is-found .asset-open').click();await walk().getByLabel('Следующее обслуживание',{exact:true}).fill('2026-12-20');await walk().getByRole('button',{name:'Сохранить запись',exact:true}).click();await link().click();await expect(sheet().locator('.attention-row')).toHaveCount(5);await expect(sheet().locator('.attention-overdue')).toHaveCount(0);
    await expect.poll(async()=>(await stored()).floors[0].zones[2].assets[0].nextService).toBe('2026-12-20');
    await sheet().getByRole('button',{name:'На плане: Библиотека · Первый этаж',exact:true}).click();await expect(page.locator('dialog[open]')).toHaveCount(0);await expect(page.locator('.built-floor-plan')).toBeFocused();await expect(page.locator('.built-floor-plan .drawn-room.selected')).toHaveAttribute('data-plan-room',lower.layout.rooms[0].id);
    await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.setViewportSize({width:320,height:844});await page.getByRole('button',{name:'Аралау',exact:true}).click();await link().click();await sheet().getByRole('combobox').selectOption('verify');
    await expect(sheet().locator('.attention-row')).toHaveCount(1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await sheet().evaluate(node=>node.scrollWidth<=node.clientWidth+1),'the sheet has no internal horizontal overflow at 320px');
    await page.emulateMedia({colorScheme:'dark'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
    await page.evaluate(()=>document.querySelector('.inspection-modal').scrollTo({top:0}));await page.screenshot({path:'qa/attention-mobile-kk.png',fullPage:false});
    await sheet().getByRole('searchbox').fill('ＤＥＭＯ—０３');await expect(sheet().locator('.attention-row')).toHaveCount(1);await page.keyboard.press('Escape');await expect(sheet().getByRole('searchbox')).toHaveValue('');await expect(walk()).toBeVisible();await expect(sheet().getByRole('combobox')).toHaveValue('verify');
    await sheet().locator('.attention-open').focus();await expect(sheet().locator('.attention-open')).toBeFocused();assert.equal(await sheet().locator('.attention-open').evaluate(node=>getComputedStyle(node).outlineStyle),'solid');
    await sheet().getByRole('combobox').selectOption('all');await sheet().getByRole('searchbox').fill('қосалқы');await expect(sheet().locator('.attention-row')).toHaveCount(1);await sheet().locator('.attention-open').click();await expect(walk().locator('.walk-room-heading h3')).toHaveText(unplaced.nameKk);await link().click();await expect(sheet().getByRole('searchbox')).toHaveValue('қосалқы');
    const kkCSV=page.waitForEvent('download');await sheet().getByRole('button',{name:'Толық парақты CSV жүктеу',exact:true}).click();await (await kkCSV).saveAs('qa/attention-kk.csv');assert.match(await readFile('qa/attention-kk.csv','utf8'),/Деректерді нақтылау/);
    // The existing PDF command updates the snapshot before exporting, including this bilingual worklist.
    await walk().getByRole('button',{name:'Аралау есебі',exact:true}).click();await expect(page.locator('.attention-sheet')).toHaveCount(0);const pdfEvent=page.waitForEvent('download',{timeout:90000});await page.getByRole('button',{name:'PDF жүктеу',exact:true}).click();await (await pdfEvent).saveAs('qa/attention-report-kk.pdf');assert.equal((await readFile('qa/attention-report-kk.pdf')).subarray(0,4).toString(),'%PDF');await close();
    await page.reload();await page.getByRole('button',{name:'Аралау',exact:true}).click();await link().click();await expect(sheet().locator('.attention-row')).toHaveCount(5);
    await close();await page.getByRole('button',{name:'Нысанды ауыстыру',exact:true}).click();await page.locator('.library-kind-list').getByRole('button',{name:'Қойма',exact:true}).click();await page.getByRole('button',{name:'Нысан құру',exact:true}).click();await close();await page.getByRole('button',{name:'Аралау',exact:true}).click();await link().click();await expect(sheet().locator('.attention-row')).toHaveCount(0);await expect(sheet().locator('.attention-empty')).toContainText('Бос парақ нысанның сәйкестігін растамайды');await page.screenshot({path:'qa/attention-empty-mobile-kk.png',fullPage:false});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
  } catch(error) {await page.screenshot({path:'qa/attention-failure.png',fullPage:false}).catch(()=>{});console.log('Attention failure:',String(error));throw error;}
  finally {await context.close();}
}
