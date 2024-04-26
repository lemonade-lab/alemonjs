import { conversation } from './alemon/conversation.js'
import { Client, ClientKOOK } from './sdk/index.js'
import { BotMessage } from './alemon/bot.js'
import { ABotConfig } from '../../config/index.js'
import { loger } from '../../log.js'
/**
 * 创建实例
 * @returns
 */
export function createKOOK() {
  const kook = ABotConfig.get('kook')
  if ((kook ?? '') !== '' && (kook.token ?? '') !== '') {
    ABotConfig.set('kook', kook)
  } else {
    loger.error('[LOGIN]', '-----------------------')
    loger.error('[LOGIN]', 'KOOK ERR')
    return
  }
  new Client()
    .set(kook)
    .connect(conversation)
    .then(async () => {
      const data = await ClientKOOK.userMe().then(res => res?.data)
      if (data) {
        BotMessage.set('id', data.id)
        BotMessage.set('name', data.username)
        BotMessage.set('avatar', data.avatar)
      }
    })
}
// 客户端
export { ClientKOOK } from './sdk/index.js'
