import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';

export async function demoSmoke(browser,errors){
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const close=()=>page.locator('dialog .modal-heading button').click();
  try{
    await page.goto('http://127.0.0.1:4173');await page.locator('.quick-guide').getByRole('button',{name:'Открыть учебный пример',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Учебный корпус · пример',exact:true})).toBeVisible();
    assert.equal(await page.locator('.built-floor-plan .drawn-room').count(),5);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'qa/demo-plan.png',fullPage:true});
    await page.getByRole('button',{name:'Сменить объект',exact:true}).click();assert.equal(await page.locator('.library-object').count(),2,'the original device object is preserved');await close();
    await page.getByRole('button',{name:'Рассчитать объект',exact:true}).click();
    const result=page.locator('.result-modal');await expect(result.locator('.proof-totals section').first().locator('strong')).toHaveText('3ОП');await expect(result.locator('.proof-totals section').last().locator('strong')).toHaveText('1ОУ');
    await expect(result.getByLabel('Округление вверх: 400 / 200 = 2',{exact:true})).toBeVisible();assert.equal(await result.locator('.proof-zone.unsupported').count(),1);await expect(result.locator('.proof-scope')).toContainText('нормативная проверка');await close();
    await page.locator('.studio-zone-list').getByRole('button',{name:'Библиотека',exact:true}).click();await page.getByLabel('Площадь зоны',{exact:true}).fill('401');
    await page.getByRole('button',{name:'Пересчитать объект',exact:true}).click();await expect(result.getByLabel('Округление вверх: 401 / 200 = 3',{exact:true})).toBeVisible();await expect(result.locator('.proof-totals section').first().locator('strong')).toHaveText('4ОП');
    await page.screenshot({path:'qa/demo-result.png',fullPage:false});
    await result.getByRole('button',{name:'Перейти к PDF-отчёту',exact:true}).click();const download=page.waitForEvent('download',{timeout:90000});await page.getByRole('button',{name:'Скачать PDF',exact:true}).click();await(await download).saveAs('qa/demo-report-ru.pdf');assert.equal((await readFile('qa/demo-report-ru.pdf')).subarray(0,4).toString(),'%PDF');await close();
    await page.getByRole('button',{name:'Рассчитать объект',exact:true}).click();await result.getByRole('button',{name:'Источники и границы методики',exact:true}).click();await expect(page.locator('.source-entry').first()).toContainText('СТ РК 1487-2006');await close();
    await page.getByRole('button',{name:'ҚАЗ',exact:true}).click();await page.setViewportSize({width:320,height:720});await page.getByRole('button',{name:'Нысанды есептеу',exact:true}).click();await expect(result.locator('.proof-totals')).toBeVisible();
    assert.equal(await result.evaluate(el=>el.scrollWidth>el.clientWidth),false,'the calculation proof fits the narrow Kazakh screen');await page.screenshot({path:'qa/demo-result-mobile-kk.png',fullPage:false});await close();
    // Opening the training object from an account must never overwrite its shared record.
    await page.setViewportSize({width:1440,height:1050});await page.getByRole('button',{name:'RU',exact:true}).click();await page.getByRole('button',{name:'Войти · OrtQalqan',exact:true}).click();
    const account=page.locator('.account-modal');await account.getByRole('button',{name:'Создать аккаунт',exact:true}).first().click();await account.getByLabel('Ваше имя',{exact:true}).fill('Учебный инспектор');await account.getByLabel('Почта',{exact:true}).fill('showcase@example.test');await account.getByLabel('Пароль',{exact:true}).fill('Showcase team demo passphrase');await account.getByLabel('Название рабочей группы',{exact:true}).fill('Учебная группа');await account.locator('form button[type=submit]').click();
    await account.getByRole('button',{name:'Скопировать текущий черновик в группу',exact:true}).click();await page.locator('.studio-cloud-state').waitFor();
    const original=await page.evaluate(async()=>{const session=await(await fetch('/api/session')).json();const group=await(await fetch('/api/workspaces/'+session.workspaces[0].id)).json();const path='/api/workspaces/'+session.workspaces[0].id+'/objects/'+group.objects[0].id;return {path,data:await(await fetch(path)).json()};});
    await page.locator('.studio-zone-list').getByRole('button',{name:'Библиотека',exact:true}).click();await page.getByLabel('Площадь зоны',{exact:true}).fill('450');
    await page.getByRole('button',{name:'Инструкция',exact:true}).click();page.once('dialog',d=>d.dismiss());await page.locator('.quick-guide').getByRole('button',{name:'Открыть учебный пример',exact:true}).click();assert.equal(await page.locator('.studio-cloud-state').count(),1,'cancelling keeps the current shared draft');
    page.once('dialog',d=>d.accept());await page.locator('.quick-guide').getByRole('button',{name:'Открыть учебный пример',exact:true}).click();await expect(page.locator('.studio-cloud-state')).toHaveCount(0);
    const stillSaved=await page.evaluate(async path=>(await fetch(path)).json(),original.path);assert.deepEqual(stillSaved,original.data,'the showcase does not write to an existing shared object');
    assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:'qa/demo-failure.png',fullPage:false});console.log('Demo error messages:',await page.locator('.account-error,.remote-save-error').allTextContents());throw error;}
  finally{await context.close();}
}
