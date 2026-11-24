const app = document.querySelector('#app');
const admin = new URLSearchParams(location.search).has('admin');
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let catalog, config, screen = 'start', tab = 'draw', selected = 0, edit = null, drawing = false, busy = false, notice = '';
let card = {cells:Array(9).fill(null), marks:Array(9).fill(null), words:[]};
try {
  const saved = JSON.parse(localStorage.getItem('doubutsu-bingo-card-v1'));
  if (saved?.cells?.length === 9 && saved?.marks?.length === 9 && Array.isArray(saved.words)) card = saved;
} catch {}
const save = () => { try { localStorage.setItem('doubutsu-bingo-card-v1', JSON.stringify(card)); } catch {} };
const random = items => items[Math.floor(Math.random() * items.length)];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const winners = () => lines.filter(line => line.every(i => card.marks[i]));
const art = a => a?.image ? '<img class="art" alt="" src="'+escape(a.image)+'">' : '<span class="art" aria-hidden="true">'+escape(a?.emoji || '＋')+'</span>';
const button = (action, label, css='', disabled=false) => '<button type="button" class="'+css+'" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
const msg = () => '<p class="notice error" role="alert"'+(notice?'':' hidden')+'>'+escape(notice)+'</p>';
async function api(path, body) {
  const response = await fetch('/api/'+path, body === undefined ? {} : {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '通信に失敗しました。');
  return value;
}
function tile(a, i, mode, win=false) {
  const mark = mode === 'play' ? card.marks[i] : null;
  const pressed = mode === 'play' ? Boolean(mark) : mode === 'slot' && selected === i;
  return '<button type="button" class="tile'+(win?' win':'')+(mode==='slot'&&pressed?' active':'')+'" data-action="'+mode+':'+i+'" aria-pressed="'+pressed+'" aria-label="'+escape((a?.name || '空きマス')+(mark?'、'+mark:''))+'">'+art(a)+'<span>'+escape(a?.name || '空きマス')+'</span>'+(mark?'<span class="stamp" aria-hidden="true">'+escape(mark)+'</span>':'')+'</button>';
}
function renderPlayer() {
  const filled = card.cells.filter(Boolean).length;
  const won = winners();
  if (screen === 'start') return '<div class="panel hero"><div class="animals" aria-hidden="true"><span>🦁</span><span>🐼</span><span>🐰</span></div><h1>どうぶつビンゴ</h1><p>好きな動物をえらんで、<br>自分だけのビンゴカードをつくろう。</p>'+button('new','カードをつくる','primary')+(filled===9?button('resume','前のカードで遊ぶ'):'')+'</div>';
  if (screen === 'edit') {
    const candidates = catalog.animals.filter(a => !card.cells.some(c => c?.id === a.id));
    return '<div class="panel"><div class="row"><h1>カードをつくる</h1><strong>'+filled+' / 9</strong></div><div class="grid">'+card.cells.map((a,i)=>tile(a,i,'slot')).join('')+'</div><p class="muted">マスをタップしてから、置きたい動物を選びます。</p>'+button('clear','選択中のマスを空ける','',!card.cells[selected])+button('play','あそぶ','primary',filled!==9)+'<h2>動物をえらぶ</h2><div class="grid pool">'+candidates.map(a=>tile(a,a.id,'pick')).join('')+'</div></div>';
  }
  return '<div class="panel"><h1>わたしのビンゴ</h1><p data-play-status aria-live="polite" class="'+(won.length?'winner':'muted')+'">'+(won.length?'ビンゴ！ '+won.length+'列成立':'当たったマスをタップ')+'</p><div class="grid" data-card>'+card.cells.map((a,i)=>tile(a,i,'play',won.some(line=>line.includes(i)))).join('')+'</div>'+button('image','カードを画像で保存','primary')+button('start','スタート画面へ')+'</div>';
}
function renderAdmin() {
  if (!config) return '<div class="panel"><h1>管理画面</h1><form data-form="login"><label>管理者パスワード<input name="password" autocomplete="current-password" type="password" required></label><button class="primary">ログイン</button></form></div>';
  const nav = '<div class="row"><div class="row">'+[['draw','抽選'],['animals','動物の管理'],['words','スタンプ設定']].map(([id,label])=>button('tab:'+id,label,id===tab?'active':'')).join('')+'</div>'+button('logout','ログアウト')+'</div>';
  if (tab === 'animals') {
    const target = config.animals.find(a=>a.id===edit);
    return nav+'<div class="columns"><section class="panel"><h2>動物一覧（'+config.animals.length+'種類）</h2><div class="entries">'+config.animals.map(a=>'<div class="entry">'+art(a)+'<span>'+escape(a.name)+'</span><span class="muted">'+(a.visible?'公開':'非表示')+'</span>'+button('edit:'+a.id,'編集')+'</div>').join('')+'</div></section><section class="panel" style="align-self:start"><h2>'+(target?'動物を編集':'動物を追加')+'</h2><form data-form="animal"><label>名前<input name="name" type="text" maxlength="24" required value="'+escape(target?.name || '')+'"></label><label>画像<input name="image" type="file" accept="image/png,image/jpeg,image/webp" '+(!target?'required':'')+'></label><p class="muted">PNG・JPEG・WebP</p><label class="check"><input type="checkbox" name="visible" '+(target?.visible!==false?'checked':'')+'> カード作成の候補に表示する</label><button class="primary" '+(busy?'disabled':'')+'>保存する</button></form>'+(target?button('cancel','新しい動物を追加'):'')+'</section></div>';
  }
  if (tab === 'words') {
    return nav+'<section class="panel"><h1>スタンプ設定</h1><p>今回使う言葉を選んで保存してください。</p><form data-form="words"><div class="words">'+config.words.map((w,i)=>'<span class="word"><label class="check"><input type="checkbox" name="active" value="'+i+'" '+(w.active?'checked':'')+'>'+escape(w.text)+'</label>'+button('remove:'+i,'削除')+'</span>').join('')+'</div><label>言葉を追加（8文字まで）<input type="text" name="word" maxlength="16"></label><div class="row"><button name="intent" value="add">言葉を追加</button><button name="intent" value="save" class="primary">使う言葉を保存</button></div></form><p class="muted">変更は次にプレイを開始するカードから反映されます。</p></section>';
  }
  const round = config.round;
  const last = round?.drawn.at(-1);
  const remaining = round ? round.pool.length-round.drawn.length : 0;
  return nav+'<section class="panel"><div class="row"><h1>動物を抽選</h1>'+button('round',round?'新しい回を始める':'抽選を始める','',drawing)+'</div><div class="columns"><div class="draw" data-stage><span class="muted">今回の動物</span><div data-art>'+art(last || {emoji:'🎲'})+'</div><strong data-result aria-live="polite">'+escape(last?.name || '抽選前')+'</strong></div><div><h2>抽選履歴</h2><p class="muted">'+(round?round.drawn.length+' / '+round.pool.length+' 種類':'抽選を始めると候補が確定します')+'</p><div class="history">'+(round?.drawn.slice().reverse().map(a=>'<span class="chip">'+escape(a.name)+'</span>').join('') || '')+'</div></div></div>'+button('draw',drawing?'抽選中…':round&&remaining===0?'すべて抽選済み':'1種類引く','primary',drawing||!remaining)+'</section>';
}
function render() {
  app.className=admin?'admin':'';
  app.innerHTML=msg()+(admin?renderAdmin():catalog?renderPlayer():'<p role="status">動物一覧を読み込み中…</p>');
}
async function png() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=960;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#eff4e9';ctx.fillRect(0,0,960,960);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#203c2e';ctx.font='bold 53px sans-serif';ctx.fillText('どうぶつビンゴ',480,71);
  const won=winners();
  ctx.font='bold 26px sans-serif';ctx.fillText(won.length?'ビンゴ！ '+won.length+'列成立':new Intl.DateTimeFormat('ja-JP').format(new Date()),480,123);
  await Promise.all(card.cells.map(async(a,i)=>{
    const x=66+i%3*280,y=156+Math.floor(i/3)*255;
    ctx.fillStyle=won.some(line=>line.includes(i))?'#f9e8b6':'#fffdf6';
    ctx.beginPath();ctx.roundRect(x,y,268,243,20);ctx.fill();
    if(a.image){
      const img=new Image();img.src=a.image;await img.decode();
      const scale=Math.min(156/img.width,143/img.height);
      ctx.drawImage(img,x+134-img.width*scale/2,y+96-img.height*scale/2,img.width*scale,img.height*scale);
    }else{
      ctx.font='108px sans-serif';ctx.fillText(a.emoji,x+134,y+99);
    }
    ctx.fillStyle='#203c2e';ctx.font='bold 25px sans-serif';ctx.fillText(a.name,x+134,y+198,248);
    if(card.marks[i]){
      ctx.save();ctx.translate(x+134,y+116);ctx.rotate(-.22);
      ctx.fillStyle='#fff0e3e8';ctx.strokeStyle='#ab3d2d';ctx.lineWidth=6;
      ctx.beginPath();ctx.ellipse(0,0,104,68,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#a9362b';ctx.font='bold 33px sans-serif';ctx.fillText(card.marks[i],0,0,182);ctx.restore();
    }
  }));
  const link=document.createElement('a');
  link.href=canvas.toDataURL('image/png');link.download='どうぶつビンゴ.png';link.click();
}
async function refresh(){config=await api('admin');}
async function draw() {
  drawing=true;
  render();
  const candidates=config.round.pool.filter(a=>!config.round.drawn.some(d=>d.id===a.id));
  const stage=app.querySelector('[data-stage]');
  app.querySelector('[data-result]').textContent='抽選中…';
  try {
    const animation=async()=>{
      if(reduce.matches)return;
      for(const delay of [70,75,90,110,145,195,245]){
        stage.querySelector('[data-art]').innerHTML=art(random(candidates));
        await wait(delay);
      }
    };
    const [result]=await Promise.allSettled([api('draw',{}),animation()]);
    if(result.status==='rejected')throw result.reason;
    config=result.value;
  } finally {drawing=false;}
  render();app.querySelector('[data-stage]')?.classList.add('land');
}
app.addEventListener('click',async event=>{
  const control=event.target.closest('[data-action]');
  if(!control||busy||drawing)return;
  const [action,value]=control.dataset.action.split(':');
  const i=Number(value);
  notice='';
  try {
    switch(action){
      case 'new':
        if(card.marks.some(Boolean)&&!confirm('新しいカードを作りますか？ 今のカードは置き換わります。'))return;
        catalog=await api('catalog');card={cells:Array(9).fill(null),marks:Array(9).fill(null),words:[]};selected=0;screen='edit';save();break;
      case 'resume':screen='play';break;
      case 'start':screen='start';break;
      case 'slot':selected=i;break;
      case 'clear':card.cells[selected]=null;save();break;
      case 'pick':card.cells[selected]=catalog.animals.find(a=>a.id===value);selected=card.cells.findIndex(a=>!a);if(selected<0)selected=0;save();break;
      case 'play':
        if(value===undefined){catalog=await api('catalog');card.words=catalog.words;screen='play';save();break;}
        card.marks[i]=card.marks[i]?null:random(card.words)||'あたり';save();render();
        {const cell=app.querySelector('[data-action="play:'+i+'"]');cell.focus({preventScroll:true});if(card.marks[i])cell.classList.add('fresh');}
        return;
      case 'image':await png();return;
      case 'tab':tab=value;break;
      case 'edit':edit=value;break;
      case 'cancel':edit=null;break;
      case 'round':
        if(config.round&&!confirm('現在の抽選履歴を消して、新しい回を始めますか？'))return;
        config=await api('round',{});break;
      case 'draw':await draw();return;
      case 'logout':await api('logout',{});config=null;break;
      case 'remove':{
        const words=readWords(app.querySelector('form'));
        words.splice(i,1);config=await api('words',{words});break;
      }
    }
  }catch(error){notice=error.message;}
  render();
  if(['new','resume','start','play'].includes(action))scrollTo(0,0);
});
function readWords(form) {
  const selected=new Set(new FormData(form).getAll('active').map(Number));
  return config.words.map((word,i)=>({...word,active:selected.has(i)}));
}
async function imageData(file) {
  if(!file?.size)return '';
  if(file.size>12_000_000)throw new Error('12 MB以下の画像を選んでください。');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=url;await img.decode();
    const scale=Math.min(1,384/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp',.84);
  } finally {URL.revokeObjectURL(url);}
}
app.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||drawing)return;
  const form=event.target,data=new FormData(form);
  busy=true;notice='';
  for(const btn of form.querySelectorAll('button'))btn.disabled=true;
  try {
    switch(form.dataset.form){
      case 'login':await api('login',{password:data.get('password')});await refresh();break;
      case 'animal':
        config=await api('animal',{id:edit,name:data.get('name'),visible:data.has('visible'),image:await imageData(data.get('image'))});
        edit=null;break;
      case 'words':{
        const words=readWords(form),text=data.get('word').trim();
        if(event.submitter?.value==='add'){
          if(!text)throw new Error('追加する言葉を入力してください。');
          words.push({text,active:true});
        }
        config=await api('words',{words});break;
      }
    }
  }catch(error){notice=error.message;}
  busy=false;
  if(notice){
    const alert=app.querySelector('[role=alert]');
    alert.textContent=notice;alert.hidden=false;
    for(const btn of form.querySelectorAll('button'))btn.disabled=false;
  }else render();
});
render();
try {
  if(admin){
    try {await refresh();} catch(error) {if(error.message!=='管理者としてログインしてください。')throw error;}
  }else catalog=await api('catalog');
}catch(error){notice=error.message;}
render();
