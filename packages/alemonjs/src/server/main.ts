import Koa from 'koa';
import koaCors from '@koa/cors';
import MessageRouter from './routers/router';
import { ResultCode } from '../core';

/**
 * 创建服务器
 * @returns
 */
export const createServer = (port, listeningListener) => {
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
    // const server = app.listen(port, listeningListener);

    // // 创建 WebSocketServer 并监听同一个端口
    // global.chatbotServer = new WebSocketServer({ server });

    // // 处理客户端连接
    // global.chatbotServer.on('connection', (ws, request) => {
    //     // 如何处理
    // });
    // chatbotServer.on('error', (error) => {
    // });
    // chatbotServer.on('close', () => { });
  } catch (error) {
    logger.error({
      code: ResultCode.FailInternal,
      message: '创建应用服务器失败',
      data: error
    });
  }
};
