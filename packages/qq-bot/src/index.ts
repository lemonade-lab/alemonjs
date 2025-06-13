import { getConfigValue } from 'alemonjs'
import { start as startGroup } from './index.group'
import { start as startGuild } from './index.guild'
import { start as startWebhook } from './index.webhook'
import { start as startWebsocket } from './index.websoket'
import { platform } from './register'
// 平台
export { platform }
// hook
export { useMode } from './hook'
// api
export { QQBotAPI as API } from './sdk/api'
// main
export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  if (config?.mode == 'guild') {
    startGroup()
    return
  } else if (config?.mode == 'group') {
    startGuild()
    return
  } else if (config?.route || config?.port || config?.ws) {
    startWebhook()
    return
  } else {
    startWebsocket()
  }
}
