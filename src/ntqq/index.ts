import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import {
  setBotConfig,
  createClient,
  ClientAPIByQQ,
  ClinetWeb,
  getWebConfig,
  BotConfig
} from './sdk/index.js'
import { createWeb } from './sdk/web/client.js'
import { getIP } from '../core/index.js'

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
    setBotConfig(g)

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
      setBotConfig(g)

      console.info('刷新时间:', data.expires_in, '秒')

      setTimeout(bal, data.expires_in * 1000)
    }

    setTimeout(bal, data.expires_in * 1000)

    /**
     * 创建客户端
     */
    createClient(conversation, cfg?.shard ?? [0, 1])

    /**
     * 创建web端
     */
    createWeb({
      callback_port: cfg.port,
      http: cfg.http,
      img_url: cfg.img_url,
      IMAGE_DIR: cfg.IMAGE_DIR,
      img_size: cfg.size
    })

    const webCfg = getWebConfig()

    /**
     * 获取ip4
     */
    const ip = await getIP()
    if (ip) {
      console.info(
        `[OPEN] ${webCfg.http ?? 'http'}://${ip}:${webCfg.port ?? 9090}`
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
