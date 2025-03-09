import { getConfigValue } from 'alemonjs'
export const name = 'core:config'
export const regular = /^(#|\/)?config$/
export default OnResponse(
  [
    () => {
      const config = getConfigValue()
      console.log('test', config)
    }
  ],
  ['message.create', 'private.message.create']
)
