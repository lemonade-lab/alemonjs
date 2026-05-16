import Koa from 'koa';
import koaCors from '@koa/cors';
import MessageRouter from './http/routers/router.js';
import { ResultCode } from '../../common/variable.js';

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
