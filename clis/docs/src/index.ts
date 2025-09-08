export default defineChildren({
  onMounted({ response, middleware }) {
    logger.info(`[测试机器人启动]`, { response, middleware });
  },
  unMounted() {
    logger.info(`[测试机器人卸载]`);
  }
});
