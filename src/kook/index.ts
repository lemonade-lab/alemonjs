import { conversation } from './alemon/conversation.js'
import { createClient, ClientKOOK } from './sdk/index.js'
import { setBotMsgByKOOK } from './alemon/bot.js'
import { BOTCONFIG } from '../config/index.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemon() {
  /**
   * 创建登录配置
   */
  const kook = BOTCONFIG.get('kook')
  if ((kook ?? '') !== '' && (kook.token ?? '') !== '') {
    BOTCONFIG.set('kook', kook)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'KOOK ERR')
    return
  }
  /**
   * 读取配置
   */
  const cfg = BOTCONFIG.get('kook')
  /**
   * 创建连接
   */
  await createClient(cfg.token, conversation).then(async res => {
    const data = await ClientKOOK.userMe().then(res => res?.data)
    if (data) {
      setBotMsgByKOOK({
        id: data.id,
        name: data.username,
        avatar: data.avatar
      })
      console.info('KOOK Welcome back', data.username)
    }
  })
}
// 客户端
export { ClientKOOK } from './sdk/index.js'
