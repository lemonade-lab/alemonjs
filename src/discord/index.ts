import { getIntents, createClient, config } from './sdk/index.js'
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
  // 读取配置
  const cfg = BOTCONFIG.get('discord')
  config.set('token', cfg.token)
  config.set('intent', getIntents(cfg.intent))
  // 启动监听
  createClient(conversation, cfg?.shard)
}
export { ClientDISOCRD } from './sdk/index.js'
