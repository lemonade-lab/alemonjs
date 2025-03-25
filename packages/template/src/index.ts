export default defineChildren({
  onCreated() {
    console.info('测试启动')
    // throw new Error('onCreated')
  },
  onMounted({ response, middleware }) {
    console.info('测试挂载', response, middleware)
    // console.info('测试挂载')
    // throw new Error('onMounted')
  },
  unMounted() {
    console.info('测试卸载')
  }
})
