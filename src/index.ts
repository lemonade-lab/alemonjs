import { defineChildren } from 'alemonjs'
export default defineChildren(config => {
  console.log('config', config)
  return {
    onCreated() {
      console.log('onCreated')
    }
  }
})
