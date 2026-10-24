import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createApplication, BODY_LIMIT } from './application.mjs';

const origin=process.env.ORTQALQAN_ORIGIN||'http://127.0.0.1:8787';
const app=createApplication({databasePath:process.env.ORTQALQAN_DATABASE||'var/ortqalqan.sqlite',origin});
const root=resolve('dist'),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.json':'application/json'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/',origin);
    if(url.pathname.startsWith('/api/')){
      const chunks=[];let size=0;
      for await(const chunk of req){size+=chunk.length;if(size>BODY_LIMIT){res.writeHead(413,{'Content-Type':'application/json','Connection':'close'});res.end('{"error":"tooLarge"}');return;}chunks.push(chunk);}
      const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
      const response=await app.handle(request,{clientAddress:req.socket.remoteAddress||'unknown'});
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let file=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(404);res.end();return;}
    if(!(await stat(file).catch(()=>null))?.isFile())file=resolve(root,'index.html');
    const content=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"serverError"}');}
});
server.requestTimeout=30_000;server.headersTimeout=15_000;
server.listen(Number(process.env.PORT||8787),process.env.ORTQALQAN_HOST||'127.0.0.1',()=>console.log('OrtQalqan API ready on port '+(process.env.PORT||8787)));
const stop=()=>server.close(()=>{app.close();process.exit(0);});process.on('SIGTERM',stop);process.on('SIGINT',stop);
