import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplication } from './application.mjs';

const origin='http://127.0.0.1:5173',password='correct horse battery shield';
const building=()=>({id:'building-demo',name:'Школа',nameKk:'Мектеп',address:'Петропавловск',addressKk:'Петропавл',inspector:'Тест',date:'2026-10-24',revision:0,demo:false,usage:'public',kind:'education',floors:[{id:'floor',name:'Этаж 1',nameKk:'1-қабат',zones:[{id:'zone',name:'Класс',nameKk:'Сынып',area:48,hazard:'A',category:'public',sensitive:false,temperature:'normal',automatic:'no',existing:0}],markers:[]}]});
function client(app,ip='one'){
  let cookie='';
  return {get cookie(){return cookie;},async call(path,method='GET',body,extra={}){
    const response=await app.handle(new Request(origin+path,{method,headers:{cookie,origin,'content-type':'application/json',...extra},body:method==='GET'?undefined:JSON.stringify(body||{})}),{clientAddress:ip});
    if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    return {status:response.status,headers:response.headers,data:await response.json()};
  }};
}
const register=(c,email='first@example.test',name='Инспектор Ә Ғ Қ Ң Ө Ұ Ү Һ І')=>c.call('/api/auth/register','POST',{email,password,name,workspace:'Группа Петропавл'});

test('accounts persist; sessions use HttpOnly cookies, logout revokes access and credentials never appear in responses',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'ortqalqan-account-')),databasePath=join(dir,'data.sqlite');let app=createApplication({databasePath,origin});
  try{
    const c=client(app);const result=await register(c);assert.equal(result.status,201);assert.equal(result.data.user.name,'Инспектор Ә Ғ Қ Ң Ө Ұ Ү Һ І');
    assert.match(result.headers.get('set-cookie'),/HttpOnly/);assert.match(result.headers.get('set-cookie'),/SameSite=Strict/);assert.equal(result.headers.get('cache-control'),'no-store');assert.equal(result.data.user.password_hash,undefined);
    const activeCookie=c.cookie;app.close();app=createApplication({databasePath,origin});const restored=client(app);
    assert.equal((await restored.call('/api/session','GET',null,{cookie:activeCookie})).data.user.email,'first@example.test');
    const logged=await restored.call('/api/auth/login','POST',{email:'FIRST@EXAMPLE.TEST',password});assert.equal(logged.status,200);
    assert.equal((await restored.call('/api/auth/logout','POST')).status,200);assert.equal((await restored.call('/api/session')).data.user,null);
    assert.equal((await restored.call('/api/auth/login','POST',{email:'first@example.test',password:'wrong password long enough'})).status,401);
    assert.equal(readFileSync(databasePath).includes(Buffer.from(password)),false,'the password is never stored as plaintext');
  }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});

test('workspace isolation, invitations, coordinator permissions, attribution and optimistic concurrency are enforced on the server',async()=>{
  const app=createApplication({databasePath:':memory:',origin});
  try{
    const a=client(app,'a'),b=client(app,'b');const ra=await register(a),rb=await register(b,'second@example.test','Екінші инспектор');const wid=ra.data.workspaces[0].id,other=rb.data.workspaces[0].id;
    const made=await a.call(`/api/workspaces/${wid}/objects`,'POST',{building:building()});assert.equal(made.status,201);const id=made.data.id;
    assert.equal((await b.call(`/api/workspaces/${wid}`)).status,404);assert.equal((await b.call(`/api/workspaces/${other}/objects/${id}`)).status,404);
    const invitation=await a.call(`/api/workspaces/${wid}/invitations`,'POST');assert.equal(invitation.status,201);
    const joined=await b.call('/api/invitations/accept','POST',{token:invitation.data.token});assert.equal(joined.status,200);assert.equal(joined.data.workspaceId,wid);
    assert.equal((await b.call(`/api/workspaces/${wid}/invitations`,'POST')).status,403);
    assert.equal((await b.call(`/api/workspaces/${wid}/objects/${id}`,'PATCH',{version:1,assigneeId:rb.data.user.id,phase:'inspection'})).status,403);
    const assigned=await a.call(`/api/workspaces/${wid}/objects/${id}`,'PATCH',{version:1,assigneeId:rb.data.user.id,phase:'inspection'});assert.equal(assigned.data.version,2);assert.equal(assigned.data.assigneeId,rb.data.user.id);
    const draft=building();draft.name='Отредактировано';draft.revision=1;
    assert.equal((await b.call(`/api/workspaces/${wid}/objects/${id}`,'PUT',{version:1,building:draft})).status,409,'an older tab cannot overwrite an assignment or newer building');
    const saved=await b.call(`/api/workspaces/${wid}/objects/${id}`,'PUT',{version:2,building:draft});assert.equal(saved.status,200);assert.equal(saved.data.version,3);assert.equal(saved.data.updatedBy,rb.data.user.id);
    const board=await a.call(`/api/workspaces/${wid}`);assert.equal(board.data.objects[0].name,'Отредактировано');assert.equal(board.data.events[0].actor,'Екінші инспектор');assert.equal(board.data.events[0].action,'objectSaved');
    assert.equal(board.data.invitations.length,0);assert.equal(JSON.stringify(board.data).includes(invitation.data.token),false);
    assert.equal((await b.call('/api/invitations/accept','POST',{token:invitation.data.token})).status,410,'invitation tokens are single use');
    assert.equal((await a.call(`/api/workspaces/${wid}/objects/${id}`,'PATCH',{version:3,assigneeId:'foreign-user',phase:'review'})).status,400);
    assert.equal((await a.call(`/api/workspaces/${wid}/objects/${id}`,'PUT',{version:3,building:{...draft,floors:[]}})).status,400);
  }finally{app.close();}
});

test('revoked and expired invitations do not grant membership; session expiry and secure-cookie policy are real',async()=>{
  let clock=Date.UTC(2026,9,24);const secureOrigin='https://ortqalqan.example',app=createApplication({databasePath:':memory:',origin:secureOrigin,now:()=>clock});
  // Clients use the configured exact Origin, even behind a reverse proxy.
  const call=async(c,path,method,body)=>c.call(path,method,body,{origin:secureOrigin});
  try{
    const a=client(app,'a'),b=client(app,'b');const ra=await call(a,'/api/auth/register','POST',{email:'a@example.test',password,name:'A',workspace:'A'});await call(b,'/api/auth/register','POST',{email:'b@example.test',password,name:'B',workspace:'B'});
    assert.match(ra.headers.get('set-cookie'),/; Secure/);const wid=ra.data.workspaces[0].id;
    const inv=await call(a,`/api/workspaces/${wid}/invitations`,'POST');await call(a,`/api/workspaces/${wid}/invitations/${inv.data.id}`,'DELETE');
    assert.equal((await call(b,'/api/invitations/accept','POST',{token:inv.data.token})).status,410);
    const next=await call(a,`/api/workspaces/${wid}/invitations`,'POST');clock+=8*24*60*60*1000;
    assert.equal((await a.call('/api/session')).data.user,null);
    await call(b,'/api/auth/login','POST',{email:'b@example.test',password});assert.equal((await call(b,'/api/invitations/accept','POST',{token:next.data.token})).status,410);
  }finally{app.close();}
});

test('cross-origin writes, unauthenticated reads, weak passwords, malformed requests and repeated attempts are rejected',async()=>{
  const app=createApplication({databasePath:':memory:',origin});
  try{
    const c=client(app);
    assert.equal((await c.call('/api/workspaces/foreign')).status,401);
    assert.equal((await c.call('/api/auth/register','POST',{email:'a@example.test',password,name:'A',workspace:'A'},{origin:'https://attacker.example'})).status,403);
    assert.equal((await c.call('/api/auth/register','POST',{email:'a@example.test',password:'short',name:'A',workspace:'A'})).status,400);
    assert.equal((await c.call('/api/auth/register','POST',{}, {'content-type':'text/plain'})).status,415);
    for(let n=0;n<9;n++)await c.call('/api/auth/login','POST',{});
    assert.equal((await c.call('/api/auth/login','POST',{})).status,429);
    const response=await app.handle(new Request(origin+'/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:'bad-json'}),{clientAddress:'other'});assert.equal(response.status,400);
  }finally{app.close();}
});
