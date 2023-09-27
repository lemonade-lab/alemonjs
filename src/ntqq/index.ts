import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../login.js'
import { callBack } from './alemon/conversation.js'
import { setBotConfig, createClient, ClientAPIByQQ } from './sdk/index.js'
import { setBotMsgByNtqq } from './alemon/bot.js'

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
      process.exit()
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByKey('ntqq')

    const data: aut = await ClientAPIByQQ.getAuthentication(cfg.appID, cfg.secret).then(
      res => res.data
    )
    /**
     * 设置配置
     */
    setBotConfig({
      appID: cfg.appID,
      token: data.access_token,
      secret: cfg.secret,
      intents: ['C2C_MESSAGE_CREATE', 'GROUP_AT_MESSAGE_CREATE']
    })

    /**
     * 设置定时任务 重复设置配置
     */
    setInterval(async () => {
      console.log('重新获取token')
      const data: aut = await ClientAPIByQQ.getAuthentication(cfg.appID, cfg.secret).then(
        res => res.data
      )
      setBotConfig({
        appID: cfg.appID,
        token: data.access_token,
        secret: cfg.secret,
        intents: ['C2C_MESSAGE_CREATE', 'GROUP_AT_MESSAGE_CREATE']
      })
    }, data.expires_in * 1000)

    /**
     * 创建客户端
     */
    createClient({
      READY: async data => {
        // 设置bot信息
        setBotMsgByNtqq({
          id: data.user.id,
          name: data.user.name,
          avatar: 'string'
        })
      },
      callBack: callBack
    })

    return true
  }
  return false
}
