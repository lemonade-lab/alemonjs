import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import {
  setBotNTQQConfig,
  createClient,
  ClientAPIByQQ,
  BotConfig
} from './sdk/index.js'

interface aut {
  access_token: string
  expires_in: number
  cache: boolean
}

export async function createAlemonByNtqq() {
  /**
   * 登录
   */
  if (
    await checkRobotByQQ().catch(err => {
      console.error(err)
      return false
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByKey('ntqq')

    /**
     * 发送请求
     */
    const data: aut = await ClientAPIByQQ.getAuthentication(
      cfg.appID,
      cfg.secret
    ).then(res => res.data)

    const g = {
      appID: cfg.appID,
      token: data.access_token,
      secret: cfg.secret,
      intents: ['C2C_MESSAGE_CREATE', 'GROUP_AT_MESSAGE_CREATE']
    } as BotConfig

    /**
     * 设置配置
     */
    setBotNTQQConfig(g)

    const bal = async () => {
      /**
       * 发送请求
       */
      const data: aut = await ClientAPIByQQ.getAuthentication(
        cfg.appID,
        cfg.secret
      ).then(res => res.data)

      g.token = data.access_token

      /**
       * 设置配置
       */
      setBotNTQQConfig(g)

      console.info('刷新时间:', data.expires_in, '秒')

      setTimeout(bal, data.expires_in * 1000)
    }

    setTimeout(bal, data.expires_in * 1000)

    /**
     * 创建客户端
     */
    createClient(conversation, cfg?.shard ?? [0, 1])

    return true
  }
  return false
}
