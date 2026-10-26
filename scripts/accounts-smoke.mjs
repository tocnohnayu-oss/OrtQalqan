import assert from 'node:assert/strict';
import { expect } from '@playwright/test';

/** Real HTTP + SQLite workflow with two isolated browser identities. Synthetic data only. */
export async function accountsSmoke(browser,errors){
  const a=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  const b=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  await Promise.all([a.addInitScript(()=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.workspace.view','floor');}),b.addInitScript(()=>{localStorage.setItem('ortqalqan.guide.v1','seen');localStorage.setItem('ortqalqan.workspace.view','floor');})]);
  const first=await a.newPage(),second=await b.newPage();
  for(const page of [first,second])page.on('pageerror',error=>errors.push(error.message));
  const password='Atlas inspection demo passphrase';
  const account=page=>page.getByRole('button',{name:/^(?:Войти|Кіру) · OrtQalqan$|^(?:Аккаунт и команда|Аккаунт және топ): /});
  const panel=page=>page.locator('.account-modal');
  const close=page=>page.locator('.account-modal .modal-heading button').click();
  const register=async(page,email,name,workspace)=>{
    await panel(page).getByRole('button',{name:'Создать аккаунт',exact:true}).first().click();
    await panel(page).getByLabel('Ваше имя',{exact:true}).fill(name);
    await panel(page).getByLabel('Почта',{exact:true}).fill(email);
    await panel(page).getByLabel('Пароль',{exact:true}).fill(password);
    await panel(page).getByLabel('Название рабочей группы',{exact:true}).fill(workspace);
    await panel(page).locator('form button[type=submit]').click();
    await panel(page).locator('.team-heading').waitFor();
  };
  const editName=async(page,name)=>{
    await page.getByRole('button',{name:'Данные объекта',exact:true}).click();
    await page.locator('dialog').getByLabel('Название объекта · RU',{exact:true}).fill(name);
    await page.locator('dialog .modal-heading button').click();
  };
  try{
    await first.goto('http://127.0.0.1:4173');await account(first).click();
    await first.screenshot({path:'qa/account-entry.png',fullPage:false});
    await register(first,'coordinator@example.test','Алия Садыкова','Петропавл · учебная группа');
    await panel(first).getByRole('button',{name:'Скопировать текущий черновик в группу',exact:true}).click();
    await first.locator('.studio-cloud-state').waitFor();
    await editName(first,'Учебный корпус · ДЕМО');
    await first.getByRole('button',{name:'Сохранить в базу',exact:true}).click();await expect(first.getByRole('button',{name:'Сохранить в базу',exact:true})).toBeDisabled();
    const saved=await first.evaluate(async()=>{const s=await(await fetch('/api/session')).json();const board=await(await fetch('/api/workspaces/'+s.workspaces[0].id)).json();return {wid:s.workspaces[0].id,id:board.objects[0].id,user:s.user.id};});
    assert.equal(await first.evaluate(()=>JSON.parse(localStorage.getItem('ortqalqan.building.v1')).buildings.some(b=>b.name==='Учебный корпус · ДЕМО')),false,'server objects do not leak into the device library');
    await first.getByRole('button',{name:'Сменить объект',exact:true}).click();await panel(first).getByRole('button',{name:/Участники/}).click();
    await first.screenshot({path:'qa/team-members.png',fullPage:false});
    await panel(first).getByRole('button',{name:'Пригласить коллегу',exact:true}).click();
    const link=await panel(first).getByLabel('Ссылка приглашения',{exact:true}).inputValue();assert.match(link,/#join=[A-Za-z0-9_-]{32}$/);
    await second.goto(link);await panel(second).waitFor();
    await register(second,'inspector@example.test','Данияр Омаров','Личная группа Данияра');
    await panel(second).getByRole('button',{name:'Вступить в группу',exact:true}).click();
    await expect(panel(second).locator('.team-workspace-select select')).toHaveValue(saved.wid);
    await expect(panel(second).locator('.team-object')).toHaveCount(1);assert.equal(await panel(second).locator('.team-assignment').count(),0,'an inspector cannot edit coordinator-only assignments');
    await panel(first).getByRole('button',{name:'Обновить данные',exact:true}).click();
    await expect(panel(first).locator('.team-member-list>div')).toHaveCount(2);
    await panel(first).getByRole('button',{name:/Объекты/}).click();
    await panel(first).getByLabel('Назначение и этап: Учебный корпус · ДЕМО',{exact:true}).click();
    await panel(first).getByLabel('Этап работы',{exact:true}).selectOption('review');
    await panel(first).locator('.team-assignment').getByRole('button',{name:'Отмена',exact:true}).click();
    await panel(first).getByLabel('Назначение и этап: Учебный корпус · ДЕМО',{exact:true}).click();
    await expect(panel(first).getByLabel('Этап работы',{exact:true})).toHaveValue('draft');
    await panel(first).getByLabel('Ответственный',{exact:true}).selectOption({label:'Данияр Омаров'});
    await panel(first).getByLabel('Этап работы',{exact:true}).selectOption('inspection');
    await panel(first).locator('.team-assignment').getByRole('button',{name:'Сохранить',exact:true}).click();
    await expect(panel(first).locator('.team-phase')).toHaveText('Обход');
    await first.screenshot({path:'qa/team-objects.png',fullPage:false});
    await panel(first).getByRole('button',{name:'Открыть план: Учебный корпус · ДЕМО',exact:true}).click();
    await panel(second).getByRole('button',{name:'Обновить данные',exact:true}).click();
    await expect(panel(second).locator('.team-phase')).toHaveText('Обход');
    await panel(second).getByRole('button',{name:'Открыть план: Учебный корпус · ДЕМО',exact:true}).click();
    await editName(second,'Корпус после совместного обхода');
    await second.getByRole('button',{name:'Сохранить в базу',exact:true}).click();await expect(second.getByRole('button',{name:'Сохранить в базу',exact:true})).toBeDisabled();
    await editName(first,'Мой несохранённый вариант');await first.getByRole('button',{name:'Сохранить в базу',exact:true}).click();
    await expect(first.locator('.remote-save-error')).toContainText('В базе уже другая версия');
    const download=first.waitForEvent('download');await first.getByRole('button',{name:'Скачать свою копию',exact:true}).click();assert.equal((await download).suggestedFilename(),'ortqalqan-backup.json');
    first.once('dialog',dialog=>dialog.accept());await first.getByRole('button',{name:'Открыть версию из базы',exact:true}).click();
    await expect(first.getByRole('heading',{name:'Корпус после совместного обхода',exact:true})).toBeVisible();
    await first.screenshot({path:'qa/profile-desktop.png',fullPage:false});
    await account(first).click();await panel(first).getByRole('button',{name:/Журнал/}).click();
    await expect(panel(first).locator('.team-activity')).toContainText('Данияр Омаров');await first.screenshot({path:'qa/team-activity.png',fullPage:false});
    await panel(first).getByRole('button',{name:'Выйти',exact:true}).click();
    await expect(first.locator('.studio-cloud-state')).toHaveCount(0);await expect(first.getByRole('heading',{name:'НИШ ЕМН · Петропавловск',exact:true})).toBeVisible();
    await account(first).click();await panel(first).getByLabel('Почта',{exact:true}).fill('coordinator@example.test');await panel(first).getByLabel('Пароль',{exact:true}).fill(password);await panel(first).locator('form button[type=submit]').click();
    await expect(panel(first).locator('.team-object')).toHaveCount(1);await expect(panel(first).locator('.team-object')).toContainText('Корпус после совместного обхода');
    await close(first);await first.getByRole('button',{name:'ҚАЗ',exact:true}).click();await first.setViewportSize({width:390,height:844});await first.screenshot({path:'qa/profile-mobile-kk.png',fullPage:false});await account(first).click();
    await first.locator('.team-object').waitFor();await first.screenshot({path:'qa/team-mobile-kk.png',fullPage:false});
    await first.setViewportSize({width:320,height:720});
    assert.equal(await first.locator('.account-modal').evaluate(el=>el.scrollWidth>el.clientWidth),false,'the team archive fits 320px');
    const tabs=await first.locator('.team-tabs').boundingBox();assert.ok(tabs.x>=0&&tabs.x+tabs.width<=320,'all workspace tabs fit the narrow phone');
    await first.getByRole('button',{name:/Қатысушылар/}).click();await first.locator('.team-member-list').waitFor();await first.screenshot({path:'qa/team-members-mobile-kk.png',fullPage:false});
    await close(first);await account(first).click();
    await first.locator('.team-workspace').waitFor();await first.getByRole('button',{name:'Шығу',exact:true}).click();await account(first).click();
    await first.screenshot({path:'qa/account-entry-mobile-kk.png',fullPage:false});
    assert.equal(await first.locator('.account-modal').evaluate(el=>el.scrollWidth>el.clientWidth),false,'Kazakh sign-in fits 320px');
    const titleBox=await first.locator('.account-entry-story h3').boundingBox(),artBox=await first.locator('.account-entry-story .account-illustration').boundingBox();
    assert.ok(titleBox.y+titleBox.height<=artBox.y,'the narrow Kazakh headline and illustration never overlap');
    // A missing/expired session must preserve a downloadable draft and safely reset on a different login.
    await editName(second,'Не отправлять другому аккаунту');await b.clearCookies();
    await second.getByRole('button',{name:'Сохранить в базу',exact:true}).click();await expect(second.locator('.remote-save-error')).toContainText('Сессия завершилась');
    await account(second).click();await panel(second).getByLabel('Почта',{exact:true}).fill('coordinator@example.test');await panel(second).getByLabel('Пароль',{exact:true}).fill(password);await panel(second).locator('form button[type=submit]').click();
    await panel(second).locator('.team-heading').waitFor();assert.equal(await second.locator('.studio-cloud-state').count(),0,'switching identity clears the previous private object');
    await expect(second.locator('.studio-object-name h1')).toHaveText('НИШ ЕМН · Петропавловск');
    assert.deepEqual(errors,[]);
  }catch(error){console.log('Account UI errors:',await first.locator('.account-error,.remote-save-error').allTextContents(),await second.locator('.account-error,.remote-save-error').allTextContents());await first.screenshot({path:'qa/account-failure-first.png',fullPage:false});await second.screenshot({path:'qa/account-failure-second.png',fullPage:false});throw error;}
  finally{await a.close();await b.close();}
}
