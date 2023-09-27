import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../login.js'
import { callBack } from './alemon/conversation.js'
import { setBotConfig, createClient, ClientAPIByQQ, ClinetWeb, getWebConfig } from './sdk/index.js'
import { setBotMsgByNtqq } from './alemon/bot.js'
import { createWeb } from './sdk/web/client.js'

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
     * 挂载一下服务
     */

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

    /**
     * 创建
     */
    createWeb({})

    const webCfg = getWebConfig()

    /**
     * 获取ip4
     */
    const ip = await ClinetWeb.getIP()
    if (ip) {
      console.info(
        `[OPEN] ${webCfg.http ?? 'http'}://${ip}:${webCfg.port ?? 9090}/api/mys/callback`
      )
      // 启动清除机制
      ClinetWeb.autoClearImages(600000)
    } else {
      console.error('公网IP识别失败~暂无法支持运行')
      return
    }

    return true
  }
  return false
}
