import { Client } from './sdk/index.js'
import { conversation } from './alemon/conversation.js'
import { ABotConfig } from '../../config/index.js'
import { loger } from '../../log.js'
export function createDISCORD() {
  const discord = ABotConfig.get('discord')
  if ((discord ?? '') !== '' && (discord.token ?? '') !== '') {
    ABotConfig.set('kook', discord)
  } else {
    loger.error('[LOGIN]', '-----------------------')
    loger.error('[LOGIN]', 'KOOK ERR')
    return
  }
  new Client().set(discord).connect(conversation)
}
export { ClientDISOCRD } from './sdk/index.js'
