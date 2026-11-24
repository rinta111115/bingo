import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { createFileBucket } from './src/infrastructure/file-bucket.mjs';
import { Readable } from 'node:stream';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import './build.mjs';

const {default:worker}=await import('./dist/server/index.js');
try {
  loadEnvFile(fileURLToPath(new URL('./.env',import.meta.url)));
} catch(error) {
  if(error.code!=='ENOENT')throw error;
}
const password=process.env.ADMIN_PASSWORD;
if(!password?.trim()){
  console.error('.env の ADMIN_PASSWORD に管理者パスワードを設定してください。');
  process.exit(1);
}
const bucket=createFileBucket(
  new URL('./bingo-state.local.json',import.meta.url),
  new URL('./bingo-state.local.tmp',import.meta.url),
);
const port=Number(process.env.BINGO_PORT||8787);
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://'+req.headers.host);
    const headers=new Headers(req.headers);
    headers.delete('oai-authenticated-user-id');
    const init={method:req.method,headers};
    if(!['GET','HEAD'].includes(req.method)){
      const chunks=[];
      let size=0;
      for await(const chunk of req){
        size+=chunk.length;
        if(size>600_000){res.writeHead(413).end();return;}
        chunks.push(chunk);
      }
      init.body=Buffer.concat(chunks);
    }
    const response=await worker.fetch(new Request(url,init),{BUCKET:bucket,ADMIN_PASSWORD:password});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
  }catch(error){console.error(error);if(!res.headersSent)res.writeHead(500);res.end();}
});
server.listen(port,'0.0.0.0',()=>{
  console.log('管理画面  http://localhost:'+port+'/?admin');
  for(const interfaces of Object.values(networkInterfaces())){
    for(const info of interfaces.filter(item=>item.family==='IPv4'&&!item.internal)){
      console.log('参加者用  http://'+info.address+':'+port+'/');
    }
  }
});
