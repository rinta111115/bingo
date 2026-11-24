import { initialTheme, defaultTheme } from '../domain/themes.mjs';
import { BingoRuleError } from '../domain/bingo-game.mjs';

const key='bingo-state.json';

export function createBucketRepository(bucket) {
  async function readDocument() {
    const record=await bucket.get(key);
    if(!record)return {themes:{},etag:null};
    const saved=await record.json();
    // Older installations stored their animal game at the root.
    return {themes:saved.themes ?? {[defaultTheme]:saved},etag:record.etag};
  }
  return {
    async read(theme) {
      const {themes}=await readDocument();
      return themes[theme] ?? initialTheme(theme);
    },
    async update(theme,change) {
      for(let attempt=0;attempt<6;attempt++){
        const {themes,etag}=await readDocument();
        const state=themes[theme] ?? initialTheme(theme);
        change(state);
        themes[theme]=state;
        const onlyIf=etag?{etagMatches:etag}:{etagDoesNotMatch:'*'};
        if(await bucket.put(key,JSON.stringify({themes}),{onlyIf}))return state;
      }
      throw new BingoRuleError('同時に更新されました。もう一度お試しください。');
    },
  };
}
