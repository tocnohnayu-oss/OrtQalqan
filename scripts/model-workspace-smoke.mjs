import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {createAtlasShowcase} from '../src/data/atlas-showcase.mjs';
import {validateBuilding} from '../src/domain/calculator.mjs';

/** Real source selection, accessible model focus, moving labels and native field forms. */
export async function modelWorkspaceSmoke(browser,errors){
  const building=createAtlasShowcase({id:'model-workspace',date:'2026-10-26'}),first=building.floors[0],second=building.floors[1],teacher=second.zones[6];
  teacher.nameKk='Петропавл қаласындағы оқу корпусының мұғалімдер бөлмесі · Ә Ғ Қ Ң Ө Ұ Ү Һ І';
  first.zones[1].notes='Шкаф перекрывает подход. Кіреберісті тексеру.';
  first.zones.push({...structuredClone(first.zones[1]),id:'model-unmapped',name:'Архив без контура',nameKk:'Контурсыз мұрағат',area:0,notes:'',assets:[]});
  assert.equal(validateBuilding(building),true);
  const contexts=[];
  const open=async(language,viewport)=>{
    const context=await browser.newContext({viewport,hasTouch:true});contexts.push(context);
    await context.addInitScript(({building,language})=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.language',language);if(!localStorage.getItem('ortqalqan.building.v1'))localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},{building,language});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://127.0.0.1:4173');await expect(page.locator('.building-model')).toHaveAttribute('data-model-status','ready',{timeout:30000});await page.evaluate(()=>document.fonts.ready);return {page,context};
  };
  const stored=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings[0]);
  const close=page=>page.locator('dialog[open]>.modal-heading button').click();
  const checkLabels=async page=>{
    await expect.poll(()=>page.locator('.model-room-label').count(),{timeout:10000}).toBeGreaterThan(0);
    const {stage,labels}=await page.evaluate(()=>{const r=document.querySelector('.building-model-stage').getBoundingClientRect();return {stage:{x:r.x,y:r.y,width:r.width,height:r.height},labels:Array.from(document.querySelectorAll('.model-room-label')).map(node=>{const box=node.getBoundingClientRect();return {x:box.x,y:box.y,w:box.width,h:box.height,font:parseFloat(getComputedStyle(node.querySelector('strong')).fontSize)};})};});
    assert.ok(labels.length>0,'real projected room names are visible');
    for(const a of labels){assert.ok(a.w>=44&&a.h>=44&&a.font>=14,'readable projected label: '+JSON.stringify(a));assert.ok(a.x>=stage.x&&a.y>=stage.y&&a.x+a.w<=stage.x+stage.width+1&&a.y+a.h<=stage.y+stage.height+1);for(const b of labels)if(a!==b)assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'projected names do not overlap');}
  };
  let active;
  try{
    const {page}=await open('ru',{width:1440,height:1050});active=page;
    const model=page.locator('.building-model'),canvas=page.locator('.building-model-canvas');await canvas.evaluate(node=>node.dataset.identity='original');
    await page.screenshot({path:'qa/model-workspace-desktop.png',fullPage:true});
    await model.getByRole('button',{name:'Разрез этажа',exact:true}).click();await model.getByRole('button',{name:'Вид сверху',exact:true}).click();await checkLabels(page);
    await model.locator('[data-model-room="'+first.zones[1].id+'"]').click();await expect(canvas).toHaveAttribute('data-selected-zone',first.zones[1].id);await expect(model.locator('.model-room-context h3')).toHaveText('Класс');await expect(model.locator('.room-glyph')).toHaveAttribute('data-room-glyph','classroom');
    await model.getByRole('button',{name:'Развернуть 3D-модель',exact:true}).click();await expect(model).toHaveClass(/model-expanded/);await expect(model).toHaveAttribute('role','dialog');await expect(model.locator('.model-focus-bar h2')).toBeFocused();await expect(canvas).toHaveAttribute('data-identity','original');await expect(model.locator('.model-reference-date')).toContainText(building.date);
    // The focused viewport owns keyboard navigation, while native dialogs remain above it.
    const firstControl=model.getByRole('button',{name:'Поиск по объекту',exact:true}),reset=model.getByRole('button',{name:'Вернуть общий вид',exact:true});await firstControl.focus();await page.keyboard.press('Shift+Tab');await expect(reset).toBeFocused();await page.keyboard.press('Tab');await expect(firstControl).toBeFocused();
    await canvas.focus();await page.keyboard.press('Control+k');await expect(page.locator('.global-search-modal')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.global-search-modal')).toHaveCount(0);await expect(model).toHaveClass(/model-expanded/);await expect(canvas).toBeFocused();
    await model.getByRole('button',{name:'Осмотреть',exact:true}).click();await expect(page.locator('.inspection-modal .walk-room-heading h3')).toHaveText('Класс');await page.keyboard.press('Escape');await expect(page.locator('.inspection-modal')).toHaveCount(0);await expect(model).toHaveClass(/model-expanded/);
    await model.getByLabel('Этаж в модели',{exact:true}).selectOption(second.id);await expect(canvas).toHaveAttribute('data-selected-floor',second.id);await expect(model.locator('.model-room-sheet')).toHaveCount(0);
    await model.getByLabel('Найти помещение в модели',{exact:true}).selectOption(teacher.id);await expect(canvas).toHaveAttribute('data-selected-zone',teacher.id);await expect(model.locator('.model-room-context h3')).toHaveText(teacher.name);
    await model.getByRole('button',{name:'Названия помещений в 3D',exact:true}).click();await expect(model.locator('.model-room-label')).toHaveCount(0);await model.getByRole('button',{name:'Названия помещений в 3D',exact:true}).click();await checkLabels(page);
    const near=await canvas.getAttribute('data-camera');await model.getByRole('button',{name:'Отдалить модель',exact:true}).click();await expect(canvas).not.toHaveAttribute('data-camera',near);const away=await canvas.getAttribute('data-camera');await model.getByRole('button',{name:'Приблизить выбранное помещение',exact:true}).click();await expect(canvas).not.toHaveAttribute('data-camera',away);
    await model.locator('.model-focus-layers').getByRole('button',{name:'Осмотр',exact:true}).click();await expect(model.locator('.model-room-context p')).toHaveText('Нет записи на дату');
    await model.getByRole('button',{name:'Вернуть общий вид',exact:true}).click();await model.getByRole('button',{name:'Повернуть вправо',exact:true}).click();await checkLabels(page);await page.screenshot({path:'qa/model-room-desktop.png',fullPage:false});
    await expect.poll(()=>stored(page)).toEqual(building);await canvas.focus();await page.keyboard.press('Escape');await expect(model).not.toHaveClass(/model-expanded/);await expect(model.getByRole('button',{name:'Развернуть 3D-модель',exact:true})).toBeFocused();assert.equal(await page.locator('[inert]').count(),0);await expect(canvas).toHaveAttribute('data-identity','original');
    await model.getByLabel('Этаж в модели',{exact:true}).selectOption(first.id);await model.getByLabel('Найти помещение в модели',{exact:true}).selectOption('model-unmapped');await expect(model.locator('.model-room-context p')).toHaveText('Нет контура для 3D');await expect(model.getByRole('button',{name:'Приблизить выбранное помещение',exact:true})).toBeDisabled();await expect(model.locator('[data-model-room="model-unmapped"]')).toHaveCount(0);
    await model.getByLabel('Этаж в модели',{exact:true}).selectOption(second.id);await model.getByLabel('Найти помещение в модели',{exact:true}).selectOption(teacher.id);await model.getByRole('button',{name:'Параметры',exact:true}).click();await expect(page.locator('[data-room-heading]')).toHaveText(teacher.name);await expect(page.locator('[data-room-heading]')).toBeFocused();
    await expect.poll(()=>stored(page)).toEqual(building);await page.getByLabel('Площадь зоны',{exact:true}).fill('37');await page.getByRole('button',{name:'Здание',exact:true}).click();await expect(model).toHaveAttribute('data-model-status','ready',{timeout:30000});await page.locator('.atlas-layer-switch').getByRole('button',{name:'Расчёт',exact:true}).click();await model.getByRole('button',{name:'Разрез этажа',exact:true}).click();await model.getByLabel('Найти помещение в модели',{exact:true}).selectOption(teacher.id);await expect(model.locator('.model-room-context p')).toHaveText('Нужно обновить расчёт');await expect(model.locator('.model-room-label[data-room-state="OP"]')).toHaveCount(0);await expect(canvas).toHaveAttribute('data-layer','calculation');
    const phone=await open('kk',{width:320,height:844});active=phone.page;const mobile=phone.page,viewer=mobile.locator('.building-model'),touchCanvas=mobile.locator('.building-model-canvas');
    await viewer.getByRole('button',{name:'3D модельді жаю',exact:true}).click();await expect(viewer).toHaveClass(/model-expanded/);await expect(viewer.locator('.model-reference-date')).toContainText(building.date);assert.equal(await viewer.evaluate(node=>node.scrollWidth>node.clientWidth),false);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:'qa/model-focus-mobile-kk.png',fullPage:false});
    await viewer.getByLabel('Модельдегі қабат',{exact:true}).selectOption(second.id);await viewer.getByLabel('Модельден бөлмені табу',{exact:true}).selectOption(teacher.id);await expect(viewer.locator('.model-room-context h3')).toHaveText(teacher.nameKk);await checkLabels(mobile);
    for(const button of await viewer.locator('button:visible').all()){const bounds=await button.boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44,'mobile model actions have 44px touch targets');}
    assert.ok((await touchCanvas.boundingBox()).height>=180);assert.equal(await viewer.evaluate(node=>node.scrollWidth>node.clientWidth),false);
    await viewer.getByRole('button',{name:'3D бөлме атаулары',exact:true}).click();const box=await touchCanvas.boundingBox(),camera=await touchCanvas.getAttribute('data-camera'),client=await phone.context.newCDPSession(mobile),cx=box.x+box.width/2,cy=box.y+box.height/2;
    const touch=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((point,id)=>({...point,id,radiusX:3,radiusY:3,force:1}))});await touch('touchStart',[{x:cx-22,y:cy},{x:cx+22,y:cy}]);await touch('touchMove',[{x:cx-62,y:cy},{x:cx+62,y:cy}]);await touch('touchEnd',[]);await expect(touchCanvas).not.toHaveAttribute('data-camera',camera);await viewer.getByRole('button',{name:'3D бөлме атаулары',exact:true}).click();await viewer.getByRole('button',{name:'Таңдалған бөлмені үлкейту',exact:true}).click();await checkLabels(mobile);
    await mobile.screenshot({path:'qa/model-room-mobile-kk.png',fullPage:false});await expect.poll(()=>stored(mobile)).toEqual(building);
    await viewer.getByRole('button',{name:'Нысан бойынша іздеу',exact:true}).click();await expect(mobile.locator('.global-search-modal').getByRole('combobox')).toBeFocused();await close(mobile);await expect(viewer).toHaveClass(/model-expanded/);await expect(touchCanvas).toHaveAttribute('data-selected-zone',teacher.id);await expect(viewer.getByRole('button',{name:'Нысан бойынша іздеу',exact:true})).toBeFocused();
    await viewer.locator('.model-room-actions').getByRole('button',{name:'Қарау',exact:true}).click();await expect(mobile.locator('.inspection-modal .walk-room-heading h3')).toHaveText(teacher.nameKk);await close(mobile);await expect(viewer).toHaveClass(/model-expanded/);
    await viewer.getByRole('button',{name:'Параметрлер',exact:true}).click();await expect(mobile.locator('.model-expanded')).toHaveCount(0);await expect(mobile.locator('[data-room-heading]')).toHaveText(teacher.nameKk);await expect(mobile.locator('[data-room-heading]')).toBeFocused();await expect.poll(()=>stored(mobile)).toEqual(building);assert.deepEqual(errors,[]);
  }catch(error){await active?.screenshot({path:'qa/model-workspace-failure.png',fullPage:true}).catch(()=>{});console.log('Model workspace failure:',String(error));throw error;}
  finally{for(const context of contexts)await context.close();}
}
