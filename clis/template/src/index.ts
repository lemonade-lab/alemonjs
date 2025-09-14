import response from './res';
import middleware from './mw';

export default defineChildren({
  // 注册
  register() {
    return {
      // 注册响应体
      response,
      // 注册中间件
      middleware
    };
  },
  onCreated() {
    logger.info(`[测试机器人启动]`);
  }
});
