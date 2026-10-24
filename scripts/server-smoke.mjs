import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Real HTTP, one process, and a private disposable database outside the checkout.
const directory=await mkdtemp(join(tmpdir(),'ortqalqan-startup-')),database=join(directory,'test.sqlite');
let child,logs='';
async function stop(){
  if(!child||child.exitCode!==null||child.signalCode)return;
  const ended=new Promise(resolve=>child.once('exit',resolve));child.kill();
  const timer=setTimeout(()=>child.kill('SIGKILL'),5000);await ended;clearTimeout(timer);
}
async function start(args,port,production=false){
  const env={...process.env,ORTQALQAN_DATABASE:database};delete env.ORTQALQAN_ORIGIN;
  if(production){env.PORT=String(port);env.ORTQALQAN_ORIGIN=`http://127.0.0.1:${port}`;}
  logs='';child=spawn(process.execPath,args,{env,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>{logs=(logs+data).slice(-4000);});child.stderr.on('data',data=>{logs=(logs+data).slice(-4000);});
  const base=`http://127.0.0.1:${port}`;
  for(let i=0;i<100;i++){
    if(child.exitCode!==null)throw Error('Server exited before readiness: '+logs);
    try{const response=await fetch(base+'/api/health');if(response.ok){assert.deepEqual(await response.json(),{ready:true,storage:'sqlite'});return base;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('Server did not become ready: '+logs);
}
const credentials={name:'Startup inspector',email:'startup@example.test',password:'Startup test passphrase',workspace:'Disposable startup group'};
const write=(base,path,body,origin=base)=>fetch(base+'/api'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
try{
  let base=await start(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5180','--strictPort'],5180);
  assert.deepEqual(await(await fetch(base+'/api/session')).json(),{user:null,workspaces:[]});
  let response=await write(base,'/auth/register',credentials,'https://other.example');assert.equal(response.status,403);assert.equal((await response.json()).error,'originRejected');
  response=await write(base,'/auth/register',credentials);assert.equal(response.status,201);const registered=await response.json(),cookie=response.headers.get('set-cookie').split(';')[0];
  assert.equal(registered.user.email,credentials.email);
  response=await fetch(base+'/api/auth/register',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'x'.repeat(6_000_001)});assert.equal(response.status,413);assert.equal((await response.json()).error,'tooLarge');
  assert.equal((await fetch(base+'/server/application.mjs')).status,403,'server implementation is not a public Vite module');
  assert.equal((await fetch(base+'/var/test.sqlite')).status,403,'database paths are not served by Vite');
  await stop();
  base=await start(['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5180','--strictPort'],5180);
  const resumed=await(await fetch(base+'/api/session',{headers:{Cookie:cookie}})).json();assert.equal(resumed.user.id,registered.user.id,'the real SQLite session survives a Vite restart');
  await stop();
  base=await start(['server/index.mjs'],8788,true);
  response=await write(base,'/auth/login',{email:credentials.email,password:credentials.password});assert.equal(response.status,200);assert.equal((await response.json()).user.id,registered.user.id,'the production HTTP adapter uses the same account and persistent database');
  response=await write(base,'/auth/login',credentials,'https://other.example');assert.equal(response.status,403);
  console.log('Startup checks passed: direct Vite API, registration, HTTP limits, exact Origin, persistence after restart, production sign-in.');
}catch(error){console.error(logs);throw error;}
finally{await stop();await rm(directory,{recursive:true,force:true});}
