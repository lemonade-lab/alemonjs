import { checkRobotByKOOK } from './login.js'
import { conversation } from './alemon/conversation.js'
import { createClient, ClientKOOK } from './sdk/index.js'
import { setBotMsgByKOOK } from './alemon/bot.js'
import { BOTCONFIG } from '../config/index.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemonByKOOK() {
  /**
   * 创建登录配置
   */
  if (
    await checkRobotByKOOK().catch(err => {
      console.error(err)
      return false
    })
  ) {
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
    return true
  }
  return false
}
// 客户端
export { ClientKOOK } from './sdk/index.js'
