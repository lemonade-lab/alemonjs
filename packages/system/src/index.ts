import { defineChildren } from 'alemonjs'
export default defineChildren(() => {
  return {
    onCreated() {
      global.logger.log('[@alemonjs/sytem]')
    }
  }
})
