import { defineChildren, defineResponse, logger, lazy } from 'alemonjs';

// 设置路由规则
const response = defineResponse([
  {
    handler: lazy(() => import('./response/mw')),
    children: [
      {
        regular: /hello/,
        handler: lazy(() => import('./response/hello/res'))
      },
      {
        regular: /help/,
        handler: lazy(() => import('./response/help/res'))
      }
    ]
  }
]);

export default defineChildren({
  // 注册内容
  register() {
    return {
      response
    };
  },
  // 当注册完成时
  onCreated() {
    logger.info('本地测试启动');
  }
});
