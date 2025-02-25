import Res from '@src/apps/cwd'
import { getConfigValue } from 'alemonjs'
export const name = 'core:test'
export const regular = /^(#|\/)?test$/
export default OnResponse(
  [
    // Res.current,
    event => {
      const config = getConfigValue()
      console.log('test', config)
    }
  ],
  ['message.create', 'private.message.create']
)
