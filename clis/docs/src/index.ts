export default defineChildren({
  onMounted({ response, middleware }) {
    logger.info({
      message: '测试启动',
      data: {
        response,
        middleware
      }
    })
  },
  unMounted() {
    console.info('测试卸载')
  }
})
