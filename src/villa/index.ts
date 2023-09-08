import { callBackByVilla } from './alemon/conversation.js'
import { checkRobotByVilla } from './login.js'
import { Login_villa } from './config.js'
import { createClient, Client } from 'mys-villa'
import { getBotConfigByVilla } from './config.js'
export async function createAlemonByVilla() {
  /**
   * 登录
   */
  if (
    await checkRobotByVilla(Login_villa).catch(err => {
      console.error(err)
      process.exit()
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByVilla()
    /**
     * 创建应用程序
     */
    createClient(
      {
        bot_id: cfg.bot_id,
        bot_secret: cfg.secret,
        callback_port: cfg.port ?? 8080,
        callback_url: cfg.url ?? '/api/mys/callback',
        img_url: cfg.img_url ?? '/api/mys/img',
        IMAGE_DIR: cfg.IMAGE_DIR ?? 'data/mys/img'
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
        `[OPEN] ${cfg.http ?? 'http'}://${ip}:${cfg.port ?? 8080}${cfg.url ?? '/api/mys/callback'}`
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
