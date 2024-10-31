import { defineChildren } from 'alemonjs'
export default defineChildren(() => {
  return {
    onCreated() {
      console.log('[@alemonjs/sytem]')
    }
  }
})
