import { spawn } from 'node:child_process';
const preview=process.argv.includes('--preview'),port=preview?'4173':'5173';
const processes=[
  spawn(process.execPath,['server/index.mjs'],{stdio:'inherit',env:{...process.env,ORTQALQAN_ORIGIN:process.env.ORTQALQAN_ORIGIN||'http://127.0.0.1:'+port}}),
  spawn(process.execPath,['node_modules/vite/bin/vite.js',...(preview?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'inherit'})
];
let closing=false;
const stop=code=>{if(closing)return;closing=true;for(const p of processes)p.kill();process.exitCode=code;};
process.on('SIGTERM',()=>stop(0));process.on('SIGINT',()=>stop(0));for(const p of processes){p.on('error',()=>stop(1));p.on('exit',code=>stop(code||0));}
