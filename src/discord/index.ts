import { Client } from './sdk/index.js'
import { conversation } from './alemon/conversation.js'
import { BOTCONFIG } from '../config/index.js'
export async function createAlemon() {
  const discord = BOTCONFIG.get('discord')
  if ((discord ?? '') !== '' && (discord.token ?? '') !== '') {
    BOTCONFIG.set('kook', discord)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'KOOK ERR')
    return
  }
  const c = new Client()
  c.set(discord)
  c.connect(conversation)
}
export { ClientDISOCRD } from './sdk/index.js'
