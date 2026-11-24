import { html, javascript } from './assets.mjs';

const animals = [
  ['🦁','ライオン'],['🐼','パンダ'],['🐰','ウサギ'],['🐘','ゾウ'],['🦊','キツネ'],
  ['🐨','コアラ'],['🐯','トラ'],['🐸','カエル'],['🐧','ペンギン'],['🐻','クマ'],
  ['🐵','サル'],['🐹','ハムスター'],['🐶','イヌ'],['🐱','ネコ'],['🐭','ネズミ'],
  ['🐮','ウシ'],['🐷','ブタ'],['🐴','ウマ'],['🐑','ヒツジ'],['🐐','ヤギ'],
  ['🦒','キリン'],['🦓','シマウマ'],['🦛','カバ'],['🦏','サイ'],['🐪','ラクダ'],
  ['🦘','カンガルー'],['🦔','ハリネズミ'],['🐿️','リス'],['🦦','カワウソ'],['🦝','アライグマ'],
  ['🐢','カメ'],['🐊','ワニ'],['🦩','フラミンゴ'],['🦉','フクロウ'],['🐬','イルカ']
].map(([emoji,name],i)=>({id:'animal-'+(i+1),emoji,name,visible:true,image:''}));
const defaults = {
  animals, words:['あたり！','やった！','いいね！','みーつけた！'].map(text=>({text,active:true})), round:null,
};
const json = (data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
class InputError extends Error {}
const requireInput = (valid,message)=>{if(!valid)throw new InputError(message);};
const key = 'bingo-state.json';
async function current(bucket) {
  const record=await bucket.get(key);
  return record?{value:await record.json(),etag:record.etag}:{value:structuredClone(defaults),etag:null};
}
async function update(bucket, mutate) {
  for(let i=0;i<6;i++){
    const {value,etag}=await current(bucket);
    mutate(value);
    const onlyIf=etag?{etagMatches:etag}:{etagDoesNotMatch:'*'};
    if(await bucket.put(key,JSON.stringify(value),{onlyIf}))return value;
  }
  throw new InputError('同時に更新されました。もう一度お試しください。');
}
const encoder=new TextEncoder();
async function sign(secret,message) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(message));
  return Array.from(new Uint8Array(signature),n=>n.toString(16).padStart(2,'0')).join('');
}
function equal(a,b) {
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
async function authorized(request,env) {
  if(!env.ADMIN_PASSWORD) return Boolean(request.headers.get('oai-authenticated-user-id'));
  const session=request.headers.get('cookie')?.match(/(?:^|;\s*)bingo_admin=([^;]+)/)?.[1] || '';
  const [expires,nonce,signature]=session.split('.');
  return Boolean(signature && Number(expires)>Date.now() && equal(signature,await sign(env.ADMIN_PASSWORD,expires+'.'+nonce)));
}
const cookie = (request,value,age)=>({ 'Set-Cookie':'bingo_admin='+value+'; Max-Age='+age+'; Path=/; HttpOnly; SameSite=Strict'+(new URL(request.url).protocol==='https:'?'; Secure':'') });
const content = {
  '/': [html,'text/html; charset=utf-8'],
  '/app.js': [javascript,'text/javascript; charset=utf-8'],
};
export default {
  async fetch(request,env) {
    const {pathname,origin}=new URL(request.url);
    const asset=content[pathname];
    if(asset&&request.method==='GET')return new Response(asset[0],{headers:{
      'Content-Type':asset[1],'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; frame-ancestors 'self'",
    }});
    try {
      if(pathname==='/api/catalog'&&request.method==='GET'){
        const {value}=await current(env.BUCKET);
        return json({animals:value.animals.filter(a=>a.visible),words:value.words.filter(w=>w.active).map(w=>w.text)});
      }
      if(request.method==='POST'){
        if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return json({error:'この操作を実行できません。'},403);
        if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSONが必要です。'},415);
      }
      if(pathname==='/api/login'&&request.method==='POST'){
        const {password}=await request.json();
        if(!env.ADMIN_PASSWORD || typeof password!=='string' || !equal(await sign(env.ADMIN_PASSWORD,password),await sign(env.ADMIN_PASSWORD,env.ADMIN_PASSWORD)))return json({error:'パスワードを確認してください。'},401);
        const value=(Date.now()+8*3600000)+'.'+crypto.randomUUID();
        return json({ok:true},200,cookie(request,value+'.'+await sign(env.ADMIN_PASSWORD,value),8*3600));
      }
      if(!pathname.startsWith('/api/'))return new Response('Not found',{status:404});
      if(!await authorized(request,env))return json({error:'管理者としてログインしてください。'},401);
      if(pathname==='/api/admin'&&request.method==='GET')return json((await current(env.BUCKET)).value);
      if(request.method!=='POST')return json({error:'操作が見つかりません。'},404);
      if(pathname==='/api/logout')return json({ok:true},200,cookie(request,'',0));
      const body=await request.json();
      if(pathname==='/api/animal'){
        const name=typeof body.name==='string'?body.name.trim():'';
        const image=typeof body.image==='string'?body.image:'';
        requireInput(name&&Array.from(name).length<=24,'動物の名前を24文字以内で入力してください。');
        requireInput(typeof body.visible==='boolean','公開状態を指定してください。');
        requireInput(!image||(image.length<=420_000&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)),'画像が大きすぎるか、対応していない形式です。');
        return json(await update(env.BUCKET,state=>{
          const existing=state.animals.find(a=>a.id===body.id);
          requireInput(!body.id||existing,'動物が見つかりません。');
          requireInput(!state.animals.some(a=>a.id!==body.id&&a.name===name),'同じ名前の動物が登録されています。');
          requireInput(existing||image,'画像を選んでください。');
          const data={name,image:image||existing?.image||'',visible:body.visible};
          if(existing)Object.assign(existing,data);
          else state.animals.push({id:crypto.randomUUID(),...data});
        }));
      }
      if(pathname==='/api/words'){
        const {words}=body;
        requireInput(Array.isArray(words)&&words.length<=80&&words.every(w=>typeof w?.text==='string'&&w.text.trim()&&Array.from(w.text.trim()).length<=8&&typeof w.active==='boolean'),'スタンプの言葉は1〜8文字で入力してください。');
        const clean=words.map(w=>({text:w.text.trim(),active:w.active}));
        requireInput(new Set(clean.map(w=>w.text)).size===clean.length,'同じ言葉が複数あります。');
        requireInput(clean.some(w=>w.active),'今回使う言葉を1つ以上選んでください。');
        return json(await update(env.BUCKET,state=>{state.words=clean;}));
      }
      if(pathname==='/api/round')return json(await update(env.BUCKET,state=>{
        const pool=state.animals.filter(a=>a.visible).map(a=>({...a}));
        requireInput(pool.length>=9,'公開中の動物を9種類以上用意してください。');
        state.round={pool,drawn:[]};
      }));
      if(pathname==='/api/draw')return json(await update(env.BUCKET,state=>{
        requireInput(state.round,'抽選を始めてください。');
        const used=new Set(state.round.drawn.map(a=>a.id));
        const remaining=state.round.pool.filter(a=>!used.has(a.id));
        requireInput(remaining.length,'すべて抽選済みです。');
        state.round.drawn.push(remaining[Math.floor(Math.random()*remaining.length)]);
      }));
      return json({error:'操作が見つかりません。'},404);
    }catch(error){
      if(error instanceof InputError||error instanceof SyntaxError)return json({error:error.message},400);
      console.error(error);
      return json({error:'サーバーでエラーが発生しました。'},500);
    }
  }
};
