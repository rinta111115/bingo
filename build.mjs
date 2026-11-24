import { readFile, writeFile, mkdir } from 'node:fs/promises';

const read = name => readFile(new URL(name, import.meta.url),'utf8');
const [html,javascript,worker,manifest]=await Promise.all(['index.html','app.js','worker.mjs','.openai/hosting.json'].map(read));
const assets='const html='+JSON.stringify(html)+';\nconst javascript='+JSON.stringify(javascript)+';\n';
await Promise.all(['dist/server','dist/.openai'].map(path=>mkdir(new URL(path,import.meta.url),{recursive:true})));
await Promise.all([
  writeFile(new URL('dist/server/index.js',import.meta.url),worker.replace("import { html, javascript } from './assets.mjs';",assets)),
  writeFile(new URL('dist/.openai/hosting.json',import.meta.url),manifest),
]);
