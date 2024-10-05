import { defineChildren } from 'alemonjs'
export default defineChildren(() => {
  return {
    onCreated() {
      console.log('onCreated')
    }
  }
})
