import { getConfigValue } from 'alemonjs'
import { start as startGroup } from './index.group'
import { start as startGuild } from './index.guild'
import { start as startWebhook } from './index.webhook'
import { start as startWebsocket } from './index.websoket'
import { platform } from './register'
export { platform }
export * from './hook'

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
