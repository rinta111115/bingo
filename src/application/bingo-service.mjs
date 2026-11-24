import { requireRule, publicCatalog, saveItem, setWords, startRound, drawItem } from '../domain/bingo-game.mjs';
import { isTheme } from '../domain/themes.mjs';

export function createBingoService(repository,{createId,random}) {
  function read(theme) {
    requireRule(isTheme(theme),'テーマが見つかりません。');
    return repository.read(theme);
  }
  function update(theme,change) {
    requireRule(isTheme(theme),'テーマが見つかりません。');
    return repository.update(theme,change);
  }
  return {
    catalog:async theme=>publicCatalog(await read(theme)),
    admin:read,
    saveItem:(theme,input)=>{
      const id=createId();
      return update(theme,state=>saveItem(state,input,id));
    },
    setWords:(theme,words)=>update(theme,state=>setWords(state,words)),
    startRound:theme=>update(theme,startRound),
    draw:theme=>update(theme,state=>drawItem(state,random)),
  };
}
