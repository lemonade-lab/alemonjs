import response from './routes';
import middleware from './mws';
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
  },
  onMounted(props) {
    console.log('onMounted', props);
  }
});
