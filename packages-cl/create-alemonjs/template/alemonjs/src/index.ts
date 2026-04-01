import { defineRouter, logger, lazy } from 'alemonjs';

const selects = onSelects(['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'])

const responseRouter = defineRouter([
  {
    regular: /hello/,
    selects: selects,
    handler: lazy(() => import('./response/hello'))
  },
  {
    regular: /help/,
    selects: selects,
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
