import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { localApi } from './server/vite-api.mjs';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'ORTQALQAN_');
  return {
    plugins:[react(),localApi({databasePath:process.env.ORTQALQAN_DATABASE||env.ORTQALQAN_DATABASE,origin:process.env.ORTQALQAN_ORIGIN||env.ORTQALQAN_ORIGIN})],
    server:{host:'127.0.0.1',port:5173,strictPort:true,fs:{deny:['**/.env','**/.env.*','**/*.{crt,pem}','**/.git/**','**/*.sqlite*','**/var/**','**/server/**']}},
    preview:{host:'127.0.0.1',port:4173,strictPort:true},
    build:{chunkSizeWarningLimit:900}
  };
});
