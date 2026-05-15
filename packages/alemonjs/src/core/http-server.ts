import Koa from 'koa';
import koaCors from '@koa/cors';
import MessageRouter from '../server/routers/router.js';
import { ResultCode } from './variable.js';

/**
 * 创建应用 HTTP 服务
 */
export const createServer = (port, listeningListener) => {
  try {
    const app = new Koa();

    app.use(MessageRouter.routes());
    app.use(MessageRouter.allowedMethods());
    app.use(
      koaCors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
      })
    );
    app.listen(port, listeningListener);
  } catch (error) {
    logger.error({
      code: ResultCode.FailInternal,
      message: '创建应用服务器失败',
      data: error
    });
  }
};
