import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Start the real API with Vite itself, including direct `vite` and `vite preview`.
 * @returns {import('vite').Plugin}
 */
export function localApi({databasePath,origin}={}){
  const mount=async(server,preview)=>{
    // Native imports retain migration URLs and keep SQLite out of the Vite config/client bundle.
    const moduleAt=name=>pathToFileURL(resolve(server.config.root,'server',name)).href;
    const [{createApplication},{createApiMiddleware}]=await Promise.all([import(moduleAt('application.mjs')),import(moduleAt('http-api.mjs'))]);
    const port=(preview?server.config.preview.port:server.config.server.port)||(preview?4173:5173);
    const canonicalOrigin=origin||`http://127.0.0.1:${port}`;
    const application=createApplication({databasePath:resolve(server.config.root,databasePath||'var/ortqalqan.sqlite'),origin:canonicalOrigin});
    server.middlewares.use(createApiMiddleware(application,canonicalOrigin));
    server.httpServer?.once('close',()=>application.close());
    server.config.logger.info('OrtQalqan API + SQLite: '+canonicalOrigin+'/api/health');
  };
  return {name:'ortqalqan-local-api',configureServer:server=>mount(server,false),configurePreviewServer:server=>mount(server,true)};
}
