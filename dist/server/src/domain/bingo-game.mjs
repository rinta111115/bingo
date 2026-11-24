import { CARD_SIZE, choose } from './bingo-card.mjs';

export class BingoRuleError extends Error {}
export function requireRule(condition,message) {
  if(!condition)throw new BingoRuleError(message);
}

export const publicCatalog = state => ({
  animals:state.animals.filter(item=>item.visible),
  words:state.words.filter(word=>word.active).map(word=>word.text),
});

export function saveItem(state,input,newId) {
  const name=typeof input.name==='string'?input.name.trim():'';
  const image=typeof input.image==='string'?input.image:'';
  requireRule(name&&Array.from(name).length<=24,'素材の名前を24文字以内で入力してください。');
  requireRule(typeof input.visible==='boolean','公開状態を指定してください。');
  requireRule(!image||(image.length<=420_000&&/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)),'画像が大きすぎるか、対応していない形式です。');
  const existing=state.animals.find(item=>item.id===input.id);
  requireRule(!input.id||existing,'素材が見つかりません。');
  requireRule(!state.animals.some(item=>item.id!==input.id&&item.name===name),'同じ名前の素材が登録されています。');
  requireRule(existing||image,'画像を選んでください。');
  const data={name,image:image||existing?.image||'',visible:input.visible};
  if(existing)Object.assign(existing,data);
  else state.animals.push({id:newId,...data});
}

export function setWords(state,words) {
  requireRule(Array.isArray(words)&&words.length<=80&&words.every(w=>typeof w?.text==='string'&&w.text.trim()&&Array.from(w.text.trim()).length<=8&&typeof w.active==='boolean'),'スタンプの言葉は1〜8文字で入力してください。');
  const clean=words.map(w=>({text:w.text.trim(),active:w.active}));
  requireRule(new Set(clean.map(w=>w.text)).size===clean.length,'同じ言葉が複数あります。');
  requireRule(clean.some(w=>w.active),'今回使う言葉を1つ以上選んでください。');
  state.words=clean;
}

export function startRound(state) {
  const pool=state.animals.filter(item=>item.visible).map(item=>({...item}));
  requireRule(pool.length>=CARD_SIZE,'公開中の素材を9種類以上用意してください。');
  state.round={pool,drawn:[]};
}

export function drawItem(state,random) {
  requireRule(state.round,'抽選を始めてください。');
  const used=new Set(state.round.drawn.map(item=>item.id));
  const remaining=state.round.pool.filter(item=>!used.has(item.id));
  requireRule(remaining.length,'すべて抽選済みです。');
  state.round.drawn.push(choose(remaining,random));
}
