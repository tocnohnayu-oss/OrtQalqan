import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {createAtlasShowcase} from '../src/data/atlas-showcase.mjs';
import {validateBuilding} from '../src/domain/calculator.mjs';

/** Review the real workspace: source previews, visible actions and narrow-screen hierarchy. */
export async function workspaceReview(browser,errors){
  const building=createAtlasShowcase({id:'workspace-review',date:'2026-10-28'});
  // Use a supported raster data URL; an image has no invented 3D geometry.
  building.floors.push({id:'workspace-image',name:'Архивный план',nameKk:'Мұрағат жоспары',zones:[],markers:[],plan:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABQCAYAAACeXX40AAAA6ElEQVR4nO3SoREAIBDAsN9/Vjx3GBijgoj4is7Z60Jl6gD+ZkBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYkZUBSBiRlQFIGJGVAUgYk9QDYDQNQh4fRpQAAAABJRU5ErkJggg=='});
  building.floors.push({id:'workspace-empty',name:'Новый этаж',nameKk:'Жаңа қабат',zones:[],markers:[]});
  assert.equal(validateBuilding(building),true);
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(building=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.building.v1',JSON.stringify({version:2,activeId:building.id,buildings:[building]}));},building);
  const model=page.locator('.building-model'),canvas=page.locator('.building-model-canvas'),previews=page.locator('.atlas-floor-index');
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings[0]);
  const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'workspace fits its viewport');
  try{
    await page.goto('http://127.0.0.1:4173');await expect(model).toHaveAttribute('data-model-status','ready',{timeout:30000});await page.evaluate(()=>document.fonts.ready);await noOverflow();
    await expect(page.locator('.atlas-reference')).toBeVisible();await expect(page.locator('.atlas-reference')).toContainText(building.date);
    await expect(page.locator('.model-camera-controls')).toBeInViewport({ratio:1});await expect(page.locator('.atlas-selected-floor .button.primary')).toBeInViewport({ratio:1});assert.equal(await page.evaluate(()=>scrollY),0,'important actions are visible before scrolling');
    assert.ok((await canvas.boundingBox()).height>=350);assert.ok((await page.locator('.studio-object-header').boundingBox()).height<155,'the object heading leaves room for the working graphic');
    for(const floor of building.floors.slice(0,3)){const drawing=previews.locator(`[data-floor-drawing="${floor.id}"]`);assert.deepEqual(await drawing.locator('[data-source-room]').evaluateAll(nodes=>nodes.map(node=>node.dataset.sourceRoom)),floor.layout.rooms.map(room=>room.id));}
    await expect(previews.locator('[data-floor-image="workspace-image"] img')).toHaveAttribute('src',building.floors[3].plan);await expect(previews.locator('[data-floor-drawing="workspace-image"]')).toHaveCount(0);await expect(previews.locator('[data-floor-empty="workspace-empty"]')).toHaveCount(1);await expect(previews.locator('[data-floor-drawing="workspace-empty"]')).toHaveCount(0);
    await page.screenshot({path:'qa/workspace-desktop.png',fullPage:false});
    await model.getByLabel('Найти помещение в модели',{exact:true}).selectOption(building.floors[0].zones[1].id);await expect(canvas).toHaveAttribute('data-selected-zone',building.floors[0].zones[1].id);await expect.poll(()=>model.locator('.model-room-label').count()).toBeGreaterThan(0);await page.screenshot({path:'qa/workspace-cutaway-desktop.png',fullPage:false});
    await page.setViewportSize({width:1024,height:900});await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await noOverflow();await page.screenshot({path:'qa/workspace-tablet-kk.png',fullPage:false});
    await page.setViewportSize({width:320,height:844});await page.evaluate(()=>scrollTo(0,0));await noOverflow();
    for(const selector of ['.object-switch-button','.language-switch button','.account-trigger','.simple-nav>button','.more-menu>summary'])for(const control of await page.locator(selector).all()){const box=await control.boundingBox();if(box)assert.ok(box.width>=44&&box.height>=44,selector+' has a usable touch target: '+JSON.stringify(box));}
    await expect(model.getByRole('button',{name:'3D модельді жаю',exact:true})).toBeVisible();await page.screenshot({path:'qa/workspace-mobile-kk.png',fullPage:false});
    await model.getByRole('button',{name:'Параметрлер',exact:true}).click();await expect(page.locator('.inspector-sheet')).toBeVisible();await expect(page.locator('[data-room-heading]')).toBeFocused();await noOverflow();await page.screenshot({path:'qa/workspace-parameters-mobile-kk.png',fullPage:false});
    await page.locator('dialog[open]>.modal-heading button').click();await page.getByRole('button',{name:'Ғимарат',exact:true}).click();await expect(model).toHaveAttribute('data-model-status','ready',{timeout:30000});await expect.poll(stored).toEqual(building);assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/workspace-failure.png',fullPage:true}).catch(()=>{});console.log('Workspace review failure:',String(error));throw error;}
  finally{await context.close();}
}
