import { defineBot, getConfig } from 'alemonjs'
import INDEXV12 from './index-12'
import INDEXV11 from './index-11'
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.onebot
  if (!config) return
  if (config.version === 'v12') {
    return INDEXV12()
  }
  return INDEXV11()
})
