import { checkRobotByKOOK } from './login.js'
import { callBackByKOOK } from './alemon/conversation.js'
import { createClient, KOOKApiClient } from 'kook-ws'
import { setBotMsgByKOOK } from './alemon/bot.js'
import { getBotConfigByKey } from '../config/index.js'
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
      process.exit()
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = await getBotConfigByKey('kook')

    /**
     * 创建连接
     */
    await createClient(cfg.token, callBackByKOOK).then(async res => {
      const data = await KOOKApiClient.getBotInformation()
      if (data) {
        setBotMsgByKOOK({
          id: data.id,
          name: data.username,
          avatar: data.avatar
        })
        console.info('[KOOK] 欢迎回来', data.username)
      }
    })
    return true
  }
  return false
}
