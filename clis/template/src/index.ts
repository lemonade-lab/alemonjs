import response from './res';

export default defineChildren({
  // 注册
  register() {
    return {
      // 注册响应体
      response
    };
  },
  onCreated() {
    logger.info(`[测试机器人启动]`);
  }
});
