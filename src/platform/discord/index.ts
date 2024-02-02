import { Client } from './sdk/index.js'
import { conversation } from './alemon/conversation.js'
import { ABotConfig } from '../../config/index.js'
export default async function createAlemon() {
  const discord = ABotConfig.get('discord')
  if ((discord ?? '') !== '' && (discord.token ?? '') !== '') {
    ABotConfig.set('kook', discord)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'KOOK ERR')
    return
  }
  new Client().set(discord).connect(conversation)
}
export { ClientDISOCRD } from './sdk/index.js'
