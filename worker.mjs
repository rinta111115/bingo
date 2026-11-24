import { assets } from './assets.mjs';
import { createBingoService } from './src/application/bingo-service.mjs';
import { createBucketRepository } from './src/infrastructure/bucket-repository.mjs';
import { authorized, createSession, cookie } from './src/infrastructure/admin-session.mjs';
import { createHttpHandler } from './src/interface/http.mjs';

export default {
  fetch(request,env) {
    const service=createBingoService(createBucketRepository(env.BUCKET),{
      createId:()=>crypto.randomUUID(),random:Math.random,
    });
    const session={
      authorized:request=>authorized(request,env),
      create:password=>createSession(env.ADMIN_PASSWORD,password),
      cookie,
    };
    return createHttpHandler({service,session,assets})(request);
  },
};
