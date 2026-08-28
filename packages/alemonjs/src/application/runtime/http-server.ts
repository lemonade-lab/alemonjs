import Koa from 'koa';
import koaCors from '@koa/cors';
import MessageRouter from './http/routers/router.js';
import { ResultCode } from '../../common/variable.js';

export const createServer = (port, listeningListener) => {
  let currentPort = Number(port);
  const autoPort = process.env.autoPort === 'true' || process.env.autoPort === '1';

  const start = () => {
    const app = new Koa();

    app.use(MessageRouter.routes());
    app.use(MessageRouter.allowedMethods());
    app.use(
      koaCors({
        origin: '*',
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE']
      })
    );
    const server = app.listen(currentPort, () => listeningListener?.(currentPort));

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' && autoPort) {
        logger.warn({
          code: ResultCode.Warn,
          message: `应用服务器端口 ${currentPort} 已被占用，尝试使用端口 ${currentPort + 1}`,
          data: error.message
        });
        currentPort++;
        setTimeout(start, 0);

        return;
      }

      logger.error({
        code: ResultCode.FailInternal,
        message: error.code === 'EADDRINUSE' ? `应用服务器端口 ${currentPort} 已被占用，请检查是否有其他服务在运行` : '创建应用服务器失败',
        data: error
      });
    });
  };

  start();
};
