import { BingoRuleError } from '../domain/bingo-game.mjs';
import { defaultTheme } from '../domain/themes.mjs';

const json = (data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});

export function createHttpHandler({service,session,assets}) {
  return async function handle(request) {
    const {pathname,origin,searchParams}=new URL(request.url);
    const theme=searchParams.get('theme') ?? defaultTheme;
    const asset=assets[pathname];
    if(asset&&request.method==='GET')return new Response(asset.body,{headers:{
      'Content-Type':asset.type,'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; frame-ancestors 'self'",
    }});
    try {
      if(!pathname.startsWith('/api/'))return new Response('Not found',{status:404});
      if(pathname==='/api/catalog'&&request.method==='GET')return json(await service.catalog(theme));
      if(request.method==='POST'){
        if(request.headers.get('origin')&&request.headers.get('origin')!==origin)return json({error:'この操作を実行できません。'},403);
        if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSONが必要です。'},415);
      }
      if(pathname==='/api/login'&&request.method==='POST'){
        const body=await request.json();
        const value=await session.create(body?.password);
        if(!value)return json({error:'パスワードを確認してください。'},401);
        return json({ok:true},200,session.cookie(request,value,8*3600));
      }
      if(!await session.authorized(request))return json({error:'管理者としてログインしてください。'},401);
      if(pathname==='/api/admin'&&request.method==='GET')return json(await service.admin(theme));
      if(request.method!=='POST')return json({error:'操作が見つかりません。'},404);
      if(pathname==='/api/logout')return json({ok:true},200,session.cookie(request,'',0));
      if(pathname==='/api/animal'){
        const body=await request.json();
        if(!body||typeof body!=='object')return json({error:'素材の情報を入力してください。'},400);
        return json(await service.saveItem(theme,body));
      }
      if(pathname==='/api/words')return json(await service.setWords(theme,(await request.json())?.words));
      if(pathname==='/api/round')return json(await service.startRound(theme));
      if(pathname==='/api/draw')return json(await service.draw(theme));
      return json({error:'操作が見つかりません。'},404);
    }catch(error){
      if(error instanceof BingoRuleError||error instanceof SyntaxError)return json({error:error.message},400);
      console.error(error);
      return json({error:'サーバーでエラーが発生しました。'},500);
    }
  };
}
