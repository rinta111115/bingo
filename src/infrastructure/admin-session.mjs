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
export async function authorized(request,env) {
  if(!env.ADMIN_PASSWORD) return Boolean(request.headers.get('oai-authenticated-user-id'));
  const session=request.headers.get('cookie')?.match(/(?:^|;\s*)bingo_admin=([^;]+)/)?.[1] || '';
  const [expires,nonce,signature]=session.split('.');
  return Boolean(signature && Number(expires)>Date.now() && equal(signature,await sign(env.ADMIN_PASSWORD,expires+'.'+nonce)));
}
export const cookie = (request,value,age)=>({ 'Set-Cookie':'bingo_admin='+value+'; Max-Age='+age+'; Path=/; HttpOnly; SameSite=Strict'+(new URL(request.url).protocol==='https:'?'; Secure':'') });

export async function createSession(secret,password) {
  if(!secret || typeof password!=='string' || !equal(await sign(secret,password),await sign(secret,secret)))return null;
  const value=(Date.now()+8*3600000)+'.'+crypto.randomUUID();
  return value+'.'+await sign(secret,value);
}
