import { createServer } from 'node:http';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import './build.mjs';

const {default:worker}=await import('./dist/server/index.js');
const password=process.env.ADMIN_PASSWORD;
if(!password || password.length<8){
  console.error('ADMIN_PASSWORD に8文字以上の管理者パスワードを指定してください。');
  process.exit(1);
}
const path=new URL('./bingo-state.local.json',import.meta.url);
const temp=new URL('./bingo-state.local.tmp',import.meta.url);
function load(){
  try {
    const text=readFileSync(path,'utf8');
    return {etag:createHash('sha256').update(text).digest('hex'),json:async()=>JSON.parse(text)};
  }catch(error){if(error.code!=='ENOENT')throw error;return null;}
}
const bucket={
  get:async()=>load(),
  put:async(_key,text,{onlyIf})=>{
    const old=load();
    if(old?old.etag!==onlyIf.etagMatches:onlyIf.etagDoesNotMatch!=='*')return null;
    writeFileSync(temp,text,{mode:0o600});
    renameSync(temp,path);
    return {ok:true};
  },
};
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
