import { BODY_LIMIT } from './application.mjs';

/** The same HTTP adapter serves production and Vite. No alternate auth implementation. */
export function createApiMiddleware(application,origin){
  return async(req,res,next)=>{
    try{
      const url=new URL(req.url||'/',origin);
      if(!url.pathname.startsWith('/api/'))return next();
      const chunks=[];let size=0;
      for await(const chunk of req.iterator({destroyOnReturn:false})){size+=chunk.length;if(size>BODY_LIMIT){res.writeHead(413,{'Content-Type':'application/json','Cache-Control':'no-store','Connection':'close'});res.end('{"error":"tooLarge"}');req.resume();return;}chunks.push(chunk);}
      const request=new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
      const response=await application.handle(request,{clientAddress:req.socket.remoteAddress||'unknown'});
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch{
      if(res.headersSent){res.destroy();return;}
      res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"serverError"}');
    }
  };
}
