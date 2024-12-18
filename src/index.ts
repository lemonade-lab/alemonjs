import { defineChildren } from 'alemonjs'
export default defineChildren(() => {
  return {
    async onCreated() {
      console.info('测试启动')
    }
  }
})
