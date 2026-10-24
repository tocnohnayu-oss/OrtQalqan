import { spawn } from 'node:child_process';
const preview=process.argv.includes('--preview'),port=preview?'4173':'5173';
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<24||major===24&&minor<14){console.error('OrtQalqan requires Node.js 24.14 or newer. Current: '+process.versions.node);process.exit(1);}
const processes=[
  spawn(process.execPath,['node_modules/vite/bin/vite.js',...(preview?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{stdio:'inherit'})
];
let closing=false;
const stop=code=>{if(closing)return;closing=true;for(const p of processes)p.kill();process.exitCode=code;};
process.on('SIGTERM',()=>stop(0));process.on('SIGINT',()=>stop(0));for(const p of processes){p.on('error',()=>stop(1));p.on('exit',code=>stop(code||0));}
