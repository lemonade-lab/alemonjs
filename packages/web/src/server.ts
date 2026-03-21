import Koa from 'koa';
import koaCors from '@koa/cors';
import MessageRouter from './routers/router';

/**
 * 创建服务器
 * @returns
 */
export const createServer = (options: { port: number; listeningListener: () => void }) => {
  const {
    port,
    listeningListener = () => {
      console.log(`[@alemonjs/web] http://127.0.0.1:${port}`);
    }
  } = options || {};

  try {
    // create
    const app = new Koa();

    // MessageRouter
    app.use(MessageRouter.routes());
    app.use(MessageRouter.allowedMethods());
    // Cors
    app.use(
      koaCors({
        origin: '*', // 允许所有来源
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] // 允许的 HTTP 方法
      })
    );
    app.listen(port, listeningListener);
  } catch (error) {
    logger.error({
      code: 5000,
      message: '创建应用服务器失败',
      data: error
    });
  }
};
