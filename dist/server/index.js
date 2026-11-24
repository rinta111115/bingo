const html="<!doctype html><html lang=\"ja\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#eff4e9\"><title>どうぶつビンゴ</title>\n<style>\n:root{font:16px/1.55 system-ui,sans-serif;color:#203c2e;background:#eff4e9;--green:#27573e;--line:#d5e2d4;--cream:#fffdf6;--red:#a9362b}*{box-sizing:border-box}body{margin:0}header{display:flex;justify-content:space-between;align-items:center;gap:12px;max-width:1050px;margin:auto;padding:19px 20px}header a{color:inherit;text-decoration:none;font-weight:700}header a+a{font-size:14px}main{max-width:490px;margin:auto;padding:12px 16px 40px}main.admin{max-width:1020px}h1,h2,p{margin:0}h1{line-height:1.14;font-size:clamp(29px,7vw,44px);letter-spacing:-.05em}h2{font-size:21px}.panel{background:var(--cream);border:1px solid var(--line);border-radius:23px;padding:clamp(15px,4vw,26px);display:grid;gap:14px}.hero{text-align:center;padding-block:34px}.animals{display:flex;justify-content:center;gap:8px;margin:5px 0 14px}.animals span{display:grid;place-items:center;width:27%;aspect-ratio:1;border-radius:30% 40% 32% 45%;background:#dfeccf;font-size:clamp(34px,10vw,64px);transform:rotate(-9deg)}.animals span:nth-child(2){background:#f7dfab;transform:translateY(-10px) rotate(6deg)}.animals span:nth-child(3){background:#f5dcd1;transform:rotate(10deg)}button,input,select{font:inherit;color:inherit}button{min-height:44px;border:1px solid var(--line);border-radius:11px;padding:8px 13px;background:#fff;cursor:pointer;font-weight:650}button:disabled{opacity:.55;cursor:default}button.primary{background:var(--green);border-color:var(--green);color:white}button.active{background:#dbead7;border-color:#488263}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #886019;outline-offset:2px}.row{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.tile{position:relative;display:grid;place-items:center;align-content:center;gap:2px;min-width:0;aspect-ratio:1.14;padding:4px;font-size:clamp(11px,3vw,14px);line-height:1.2;overflow:hidden}.art{font-size:clamp(25px,8vw,42px);line-height:1.15;width:100%;height:auto;max-height:62px;object-fit:contain}.tile img{height:clamp(30px,9vw,57px)}.tile.win{background:#f9e8b6;border-color:#9a6a1d}.stamp{position:absolute;display:grid;place-items:center;inset:0;margin:auto;width:82%;aspect-ratio:1.38;border:3px double #ab3d2d;border-radius:48%;background:#fff0e3e8;color:var(--red);font-weight:900;transform:rotate(-13deg);font-size:clamp(11px,3.5vw,16px);padding:2px;overflow-wrap:anywhere;pointer-events:none}.fresh .stamp{animation:stamp .28s ease-out}.winner{color:var(--red);font-size:22px;font-weight:850}.pool .tile{aspect-ratio:auto;min-height:67px}.pool .art{font-size:29px}.pool .tile img{height:34px}.muted{color:#52665b;font-size:14px}.error{color:#a1271d;font-weight:650}.columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}.draw{min-height:220px;text-align:center;display:grid;place-content:center;justify-items:center;gap:5px;background:#e3eddb;border-radius:18px;padding:18px}.draw .art{font-size:90px;height:100px;max-height:100px}.draw strong{font-size:27px}.land .art{animation:pop .38s cubic-bezier(.15,.8,.4,1.25)}.history{display:flex;gap:6px;flex-wrap:wrap;align-content:start}.chip{border:1px solid var(--line);background:#fff;padding:4px 8px;border-radius:8px}.entries{display:grid;gap:6px}.entry{display:grid;grid-template-columns:38px minmax(65px,1fr) auto auto;align-items:center;gap:7px;border-bottom:1px solid var(--line);padding:4px 0}.entry .art{font-size:24px;width:36px;height:34px}.entry button{padding:5px 8px}.entry label{font-size:14px}form,fieldset{display:grid;gap:10px}label{display:grid;gap:4px}input[type=text],input[type=password],input[type=file]{width:100%;min-width:0;padding:8px;border:1px solid var(--line);border-radius:8px;background:white}label.check{display:flex;align-items:center;gap:7px;min-height:44px}.words{display:flex;flex-wrap:wrap;gap:7px}.word{display:flex;gap:5px;align-items:center;padding:0 8px;background:white;border-radius:9px;border:1px solid var(--line)}.word button{border:0}.notice{margin:0 0 10px}.wide{width:100%}@keyframes stamp{from{transform:translateY(-23px) scale(1.55) rotate(-20deg);opacity:0}to{transform:rotate(-13deg);opacity:1}}@keyframes pop{from{transform:scale(.65)}to{transform:scale(1)}}@media(max-width:630px){.columns{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}\n</style>\n<header><a href=\"/\">🐾 どうぶつビンゴ</a><a href=\"/?admin\">管理画面</a></header><main id=\"app\"></main>\n<script type=\"module\" src=\"/app.js\"></script></html>\n";
const javascript="const app = document.querySelector('#app');\nconst admin = new URLSearchParams(location.search).has('admin');\nconst lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];\nconst reduce = matchMedia('(prefers-reduced-motion: reduce)');\nconst escape = value => String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'})[c]);\nlet catalog, config, screen = 'start', tab = 'draw', selected = 0, edit = null, drawing = false, busy = false, notice = '';\nlet card = {cells:Array(9).fill(null), marks:Array(9).fill(null), words:[]};\ntry {\n  const saved = JSON.parse(localStorage.getItem('doubutsu-bingo-card-v1'));\n  if (saved?.cells?.length === 9 && saved?.marks?.length === 9 && Array.isArray(saved.words)) card = saved;\n} catch {}\nconst save = () => { try { localStorage.setItem('doubutsu-bingo-card-v1', JSON.stringify(card)); } catch {} };\nconst random = items => items[Math.floor(Math.random() * items.length)];\nconst wait = ms => new Promise(resolve => setTimeout(resolve, ms));\nconst winners = () => lines.filter(line => line.every(i => card.marks[i]));\nconst art = a => a?.image ? '<img class=\"art\" alt=\"\" src=\"'+escape(a.image)+'\">' : '<span class=\"art\" aria-hidden=\"true\">'+escape(a?.emoji || '＋')+'</span>';\nconst button = (action, label, css='', disabled=false) => '<button type=\"button\" class=\"'+css+'\" data-action=\"'+action+'\"'+(disabled?' disabled':'')+'>'+label+'</button>';\nconst msg = () => '<p class=\"notice error\" role=\"alert\"'+(notice?'':' hidden')+'>'+escape(notice)+'</p>';\nasync function api(path, body) {\n  const response = await fetch('/api/'+path, body === undefined ? {} : {\n    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)\n  });\n  const value = await response.json();\n  if (!response.ok) throw new Error(value.error || '通信に失敗しました。');\n  return value;\n}\nfunction tile(a, i, mode, win=false) {\n  const mark = mode === 'play' ? card.marks[i] : null;\n  const pressed = mode === 'play' ? Boolean(mark) : mode === 'slot' && selected === i;\n  return '<button type=\"button\" class=\"tile'+(win?' win':'')+(mode==='slot'&&pressed?' active':'')+'\" data-action=\"'+mode+':'+i+'\" aria-pressed=\"'+pressed+'\" aria-label=\"'+escape((a?.name || '空きマス')+(mark?'、'+mark:''))+'\">'+art(a)+'<span>'+escape(a?.name || '空きマス')+'</span>'+(mark?'<span class=\"stamp\" aria-hidden=\"true\">'+escape(mark)+'</span>':'')+'</button>';\n}\nfunction renderPlayer() {\n  const filled = card.cells.filter(Boolean).length;\n  const won = winners();\n  if (screen === 'start') return '<div class=\"panel hero\"><div class=\"animals\" aria-hidden=\"true\"><span>🦁</span><span>🐼</span><span>🐰</span></div><h1>どうぶつビンゴ</h1><p>好きな動物をえらんで、<br>自分だけのビンゴカードをつくろう。</p>'+button('new','カードをつくる','primary')+(filled===9?button('resume','前のカードで遊ぶ'):'')+'</div>';\n  if (screen === 'edit') {\n    const candidates = catalog.animals.filter(a => !card.cells.some(c => c?.id === a.id));\n    return '<div class=\"panel\"><div class=\"row\"><h1>カードをつくる</h1><strong>'+filled+' / 9</strong></div><div class=\"grid\">'+card.cells.map((a,i)=>tile(a,i,'slot')).join('')+'</div><p class=\"muted\">マスをタップしてから、置きたい動物を選びます。</p>'+button('clear','選択中のマスを空ける','',!card.cells[selected])+button('play','あそぶ','primary',filled!==9)+'<h2>動物をえらぶ</h2><div class=\"grid pool\">'+candidates.map(a=>tile(a,a.id,'pick')).join('')+'</div></div>';\n  }\n  return '<div class=\"panel\"><h1>わたしのビンゴ</h1><p data-play-status aria-live=\"polite\" class=\"'+(won.length?'winner':'muted')+'\">'+(won.length?'ビンゴ！ '+won.length+'列成立':'当たったマスをタップ')+'</p><div class=\"grid\" data-card>'+card.cells.map((a,i)=>tile(a,i,'play',won.some(line=>line.includes(i)))).join('')+'</div>'+button('image','カードを画像で保存','primary')+button('start','スタート画面へ')+'</div>';\n}\nfunction renderAdmin() {\n  if (!config) return '<div class=\"panel\"><h1>管理画面</h1><form data-form=\"login\"><label>管理者パスワード<input name=\"password\" autocomplete=\"current-password\" type=\"password\" required></label><button class=\"primary\">ログイン</button></form></div>';\n  const nav = '<div class=\"row\"><div class=\"row\">'+[['draw','抽選'],['animals','動物の管理'],['words','スタンプ設定']].map(([id,label])=>button('tab:'+id,label,id===tab?'active':'')).join('')+'</div>'+button('logout','ログアウト')+'</div>';\n  if (tab === 'animals') {\n    const target = config.animals.find(a=>a.id===edit);\n    return nav+'<div class=\"columns\"><section class=\"panel\"><h2>動物一覧（'+config.animals.length+'種類）</h2><div class=\"entries\">'+config.animals.map(a=>'<div class=\"entry\">'+art(a)+'<span>'+escape(a.name)+'</span><span class=\"muted\">'+(a.visible?'公開':'非表示')+'</span>'+button('edit:'+a.id,'編集')+'</div>').join('')+'</div></section><section class=\"panel\" style=\"align-self:start\"><h2>'+(target?'動物を編集':'動物を追加')+'</h2><form data-form=\"animal\"><label>名前<input name=\"name\" type=\"text\" maxlength=\"24\" required value=\"'+escape(target?.name || '')+'\"></label><label>画像<input name=\"image\" type=\"file\" accept=\"image/png,image/jpeg,image/webp\" '+(!target?'required':'')+'></label><p class=\"muted\">PNG・JPEG・WebP</p><label class=\"check\"><input type=\"checkbox\" name=\"visible\" '+(target?.visible!==false?'checked':'')+'> カード作成の候補に表示する</label><button class=\"primary\" '+(busy?'disabled':'')+'>保存する</button></form>'+(target?button('cancel','新しい動物を追加'):'')+'</section></div>';\n  }\n  if (tab === 'words') {\n    return nav+'<section class=\"panel\"><h1>スタンプ設定</h1><p>今回使う言葉を選んで保存してください。</p><form data-form=\"words\"><div class=\"words\">'+config.words.map((w,i)=>'<span class=\"word\"><label class=\"check\"><input type=\"checkbox\" name=\"active\" value=\"'+i+'\" '+(w.active?'checked':'')+'>'+escape(w.text)+'</label>'+button('remove:'+i,'削除')+'</span>').join('')+'</div><label>言葉を追加（8文字まで）<input type=\"text\" name=\"word\" maxlength=\"16\"></label><div class=\"row\"><button name=\"intent\" value=\"add\">言葉を追加</button><button name=\"intent\" value=\"save\" class=\"primary\">使う言葉を保存</button></div></form><p class=\"muted\">変更は次にプレイを開始するカードから反映されます。</p></section>';\n  }\n  const round = config.round;\n  const last = round?.drawn.at(-1);\n  const remaining = round ? round.pool.length-round.drawn.length : 0;\n  return nav+'<section class=\"panel\"><div class=\"row\"><h1>動物を抽選</h1>'+button('round',round?'新しい回を始める':'抽選を始める','',drawing)+'</div><div class=\"columns\"><div class=\"draw\" data-stage><span class=\"muted\">今回の動物</span><div data-art>'+art(last || {emoji:'🎲'})+'</div><strong data-result aria-live=\"polite\">'+escape(last?.name || '抽選前')+'</strong></div><div><h2>抽選履歴</h2><p class=\"muted\">'+(round?round.drawn.length+' / '+round.pool.length+' 種類':'抽選を始めると候補が確定します')+'</p><div class=\"history\">'+(round?.drawn.slice().reverse().map(a=>'<span class=\"chip\">'+escape(a.name)+'</span>').join('') || '')+'</div></div></div>'+button('draw',drawing?'抽選中…':round&&remaining===0?'すべて抽選済み':'1種類引く','primary',drawing||!remaining)+'</section>';\n}\nfunction render() {\n  app.className=admin?'admin':'';\n  app.innerHTML=msg()+(admin?renderAdmin():catalog?renderPlayer():'<p role=\"status\">動物一覧を読み込み中…</p>');\n}\nasync function png() {\n  const canvas=document.createElement('canvas');\n  canvas.width=canvas.height=960;\n  const ctx=canvas.getContext('2d');\n  ctx.fillStyle='#eff4e9';ctx.fillRect(0,0,960,960);\n  ctx.textAlign='center';ctx.textBaseline='middle';\n  ctx.fillStyle='#203c2e';ctx.font='bold 53px sans-serif';ctx.fillText('どうぶつビンゴ',480,71);\n  const won=winners();\n  ctx.font='bold 26px sans-serif';ctx.fillText(won.length?'ビンゴ！ '+won.length+'列成立':new Intl.DateTimeFormat('ja-JP').format(new Date()),480,123);\n  await Promise.all(card.cells.map(async(a,i)=>{\n    const x=66+i%3*280,y=156+Math.floor(i/3)*255;\n    ctx.fillStyle=won.some(line=>line.includes(i))?'#f9e8b6':'#fffdf6';\n    ctx.beginPath();ctx.roundRect(x,y,268,243,20);ctx.fill();\n    if(a.image){\n      const img=new Image();img.src=a.image;await img.decode();\n      const scale=Math.min(156/img.width,143/img.height);\n      ctx.drawImage(img,x+134-img.width*scale/2,y+96-img.height*scale/2,img.width*scale,img.height*scale);\n    }else{\n      ctx.font='108px sans-serif';ctx.fillText(a.emoji,x+134,y+99);\n    }\n    ctx.fillStyle='#203c2e';ctx.font='bold 25px sans-serif';ctx.fillText(a.name,x+134,y+198,248);\n    if(card.marks[i]){\n      ctx.save();ctx.translate(x+134,y+116);ctx.rotate(-.22);\n      ctx.fillStyle='#fff0e3e8';ctx.strokeStyle='#ab3d2d';ctx.lineWidth=6;\n      ctx.beginPath();ctx.ellipse(0,0,104,68,0,0,Math.PI*2);ctx.fill();ctx.stroke();\n      ctx.fillStyle='#a9362b';ctx.font='bold 33px sans-serif';ctx.fillText(card.marks[i],0,0,182);ctx.restore();\n    }\n  }));\n  const link=document.createElement('a');\n  link.href=canvas.toDataURL('image/png');link.download='どうぶつビンゴ.png';link.click();\n}\nasync function refresh(){config=await api('admin');}\nasync function draw() {\n  drawing=true;\n  render();\n  const candidates=config.round.pool.filter(a=>!config.round.drawn.some(d=>d.id===a.id));\n  const stage=app.querySelector('[data-stage]');\n  app.querySelector('[data-result]').textContent='抽選中…';\n  try {\n    const animation=async()=>{\n      if(reduce.matches)return;\n      for(const delay of [70,75,90,110,145,195,245]){\n        stage.querySelector('[data-art]').innerHTML=art(random(candidates));\n        await wait(delay);\n      }\n    };\n    const [result]=await Promise.allSettled([api('draw',{}),animation()]);\n    if(result.status==='rejected')throw result.reason;\n    config=result.value;\n  } finally {drawing=false;}\n  render();app.querySelector('[data-stage]')?.classList.add('land');\n}\napp.addEventListener('click',async event=>{\n  const control=event.target.closest('[data-action]');\n  if(!control||busy||drawing)return;\n  const [action,value]=control.dataset.action.split(':');\n  const i=Number(value);\n  notice='';\n  try {\n    switch(action){\n      case 'new':\n        if(card.marks.some(Boolean)&&!confirm('新しいカードを作りますか？ 今のカードは置き換わります。'))return;\n        catalog=await api('catalog');card={cells:Array(9).fill(null),marks:Array(9).fill(null),words:[]};selected=0;screen='edit';save();break;\n      case 'resume':screen='play';break;\n      case 'start':screen='start';break;\n      case 'slot':selected=i;break;\n      case 'clear':card.cells[selected]=null;save();break;\n      case 'pick':card.cells[selected]=catalog.animals.find(a=>a.id===value);selected=card.cells.findIndex(a=>!a);if(selected<0)selected=0;save();break;\n      case 'play':\n        if(value===undefined){catalog=await api('catalog');card.words=catalog.words;screen='play';save();break;}\n        card.marks[i]=card.marks[i]?null:random(card.words)||'あたり';save();render();\n        {const cell=app.querySelector('[data-action=\"play:'+i+'\"]');cell.focus({preventScroll:true});if(card.marks[i])cell.classList.add('fresh');}\n        return;\n      case 'image':await png();return;\n      case 'tab':tab=value;break;\n      case 'edit':edit=value;break;\n      case 'cancel':edit=null;break;\n      case 'round':\n        if(config.round&&!confirm('現在の抽選履歴を消して、新しい回を始めますか？'))return;\n        config=await api('round',{});break;\n      case 'draw':await draw();return;\n      case 'logout':await api('logout',{});config=null;break;\n      case 'remove':{\n        const words=readWords(app.querySelector('form'));\n        words.splice(i,1);config=await api('words',{words});break;\n      }\n    }\n  }catch(error){notice=error.message;}\n  render();\n  if(['new','resume','start','play'].includes(action))scrollTo(0,0);\n});\nfunction readWords(form) {\n  const selected=new Set(new FormData(form).getAll('active').map(Number));\n  return config.words.map((word,i)=>({...word,active:selected.has(i)}));\n}\nasync function imageData(file) {\n  if(!file?.size)return '';\n  if(file.size>12_000_000)throw new Error('12 MB以下の画像を選んでください。');\n  const url=URL.createObjectURL(file);\n  try {\n    const img=new Image();img.src=url;await img.decode();\n    const scale=Math.min(1,384/Math.max(img.width,img.height));\n    const canvas=document.createElement('canvas');\n    canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));\n    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);\n    return canvas.toDataURL('image/webp',.84);\n  } finally {URL.revokeObjectURL(url);}\n}\napp.addEventListener('submit',async event=>{\n  event.preventDefault();if(busy||drawing)return;\n  const form=event.target,data=new FormData(form);\n  busy=true;notice='';\n  for(const btn of form.querySelectorAll('button'))btn.disabled=true;\n  try {\n    switch(form.dataset.form){\n      case 'login':await api('login',{password:data.get('password')});await refresh();break;\n      case 'animal':\n        config=await api('animal',{id:edit,name:data.get('name'),visible:data.has('visible'),image:await imageData(data.get('image'))});\n        edit=null;break;\n      case 'words':{\n        const words=readWords(form),text=data.get('word').trim();\n        if(event.submitter?.value==='add'){\n          if(!text)throw new Error('追加する言葉を入力してください。');\n          words.push({text,active:true});\n        }\n        config=await api('words',{words});break;\n      }\n    }\n  }catch(error){notice=error.message;}\n  busy=false;\n  if(notice){\n    const alert=app.querySelector('[role=alert]');\n    alert.textContent=notice;alert.hidden=false;\n    for(const btn of form.querySelectorAll('button'))btn.disabled=false;\n  }else render();\n});\nrender();\ntry {\n  if(admin){\n    try {await refresh();} catch(error) {if(error.message!=='管理者としてログインしてください。')throw error;}\n  }else catalog=await api('catalog');\n}catch(error){notice=error.message;}\nrender();\n";


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
