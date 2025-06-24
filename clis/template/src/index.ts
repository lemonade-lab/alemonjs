export default defineChildren({
  onCreated() {
    logger.info({
      message: '测试启动'
    })
    // throw new Error('onCreated')
  }
  // onMounted({ response, middleware }) {
  //   console.info('测试挂载', response, middleware)
  // },
  // onMounted() {
  // console.info('测试挂载')
  // },
  // unMounted() {
  //   console.info('测试卸载')
  // }
})
