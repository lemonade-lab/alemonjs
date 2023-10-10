import { callBackByVilla } from './alemon/conversation.js'
import { checkRobotByVilla } from './login.js'
import { createClient, Client, hmacSha256 } from 'mys-villa'
import { getBotConfigByKey } from '../login.js'
export async function createAlemonByVilla() {
  /**
   * 登录
   */
  if (
    await checkRobotByVilla().catch(err => {
      console.error(err)
      process.exit()
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByKey('villa')

    if ((cfg.pub_key ?? '') != '') {
      cfg.secret = hmacSha256(cfg.secret, cfg.pub_key)
    }

    createClient(
      {
        bot_id: cfg.bot_id,
        bot_secret: cfg.secret,
        callback_port: cfg.port ?? 8080,
        callback_url: cfg.url ?? '/api/mys/callback',
        img_url: cfg.img_url ?? '/api/mys/img',
        IMAGE_DIR: cfg.IMAGE_DIR ?? '/data/mys/img'
      },
      callBackByVilla,
      async () => {
        console.info('[HELLO] 欢迎使用大别野')
      }
    )

    /**
     * 获取ip4
     */
    const ip = await Client.getIP()
    if (ip) {
      console.info(
        `[OPEN] ${cfg.http ?? 'http'}://${ip}:${cfg.port ?? 8080}${
          cfg.url ?? '/api/mys/callback'
        }`
      )
      // 启动清除机制
      Client.autoClearImages(600000)
    } else {
      console.error('公网IP识别失败~暂无法支持运行')
      return
    }
    return true
  }
  return false
}
