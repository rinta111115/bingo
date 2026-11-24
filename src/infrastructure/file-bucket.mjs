import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function createFileBucket(path,temp) {
  function load(){
    try {
      const text=readFileSync(path,'utf8');
      return {etag:createHash('sha256').update(text).digest('hex'),json:async()=>JSON.parse(text)};
    }catch(error){if(error.code!=='ENOENT')throw error;return null;}
  }
  return {
    get:async()=>load(),
    put:async(_key,text,{onlyIf})=>{
      const old=load();
      if(old?old.etag!==onlyIf.etagMatches:onlyIf.etagDoesNotMatch!=='*')return null;
      writeFileSync(temp,text,{mode:0o600});
      renameSync(temp,path);
      return {ok:true};
    },
  };
}
