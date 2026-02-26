import { defineRouter, logger, lazy } from 'alemonjs';

const responseRouter = defineRouter([
  {
    regular: /hello/,
    selects: ['message.create'],
    handler: lazy(() => import('./response/hello'))
  },
  {
    regular: /help/,
    selects: ['message.create'],
    handler: lazy(() => import('./response/help'))
  }
]);

export default defineChildren({
  // 注册内容
  register() {
    return {
      responseRouter
    };
  },
  // 当注册完成时
  onCreated() {
    logger.info('本地测试启动');
  }
});
