import { conversation } from './alemon/conversation.js'
import { Client, ClientKOOK } from './sdk/index.js'
import { BotMessage } from './alemon/bot.js'
import { ABotConfig } from '../config/index.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemon() {
  const kook = ABotConfig.get('kook')
  if ((kook ?? '') !== '' && (kook.token ?? '') !== '') {
    ABotConfig.set('kook', kook)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'KOOK ERR')
    return
  }
  const c = new Client()
  c.set(kook)
  c.connect(conversation).then(async res => {
    const data = await ClientKOOK.userMe().then(res => res?.data)
    if (data) {
      BotMessage.set('id', data.id)
      BotMessage.set('name', data.username)
      BotMessage.set('avatar', data.avatar)
      console.info('KOOK Welcome back', data.username)
    }
  })
}
// 客户端
export { ClientKOOK } from './sdk/index.js'
