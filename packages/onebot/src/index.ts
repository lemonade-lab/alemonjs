import { defineBot } from 'alemonjs'
export default defineBot(() => {
  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          console.log(event)
          return Promise.all([])
        }
      }
    }
  }
})
