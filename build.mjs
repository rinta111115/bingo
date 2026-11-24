import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';

const file = path => new URL(path,import.meta.url);
const read = path => readFile(file(path),'utf8');
const [html,javascript,css,rules,manifest]=await Promise.all([
  read('ui/index.html'),read('ui/app.js'),read('ui/styles.css'),read('src/domain/bingo-card.mjs'),read('.openai/hosting.json'),
]);
const assets={
  '/':{body:html,type:'text/html; charset=utf-8'},
  '/app.js':{body:javascript,type:'text/javascript; charset=utf-8'},
  '/styles.css':{body:css,type:'text/css; charset=utf-8'},
  '/bingo-card.js':{body:rules,type:'text/javascript; charset=utf-8'},
};
await Promise.all(['dist/server/','dist/.openai/'].map(path=>mkdir(file(path),{recursive:true})));
await Promise.all([
  cp(file('worker.mjs'),file('dist/server/index.js')),
  cp(file('src/'),file('dist/server/src/'),{recursive:true}),
  writeFile(file('dist/server/assets.mjs'),'export const assets='+JSON.stringify(assets)+';\n'),
  writeFile(file('dist/.openai/hosting.json'),manifest),
]);
