import { callBackByVilla } from './alemon/conversation.js'
import { checkRobotByVilla } from './login.js'
import { createClient, hmacSha256 } from './sdk/index.js'
import { getBotConfigByKey } from '../config/index.js'
export async function createAlemonByVilla() {
  // 登录
  if (
    await checkRobotByVilla().catch(err => {
      console.error(err)
      return false
    })
  ) {
    // 读取配置
    const cfg = getBotConfigByKey('villa')

    if ((cfg.pub_key ?? '') != '') {
      cfg.secret = hmacSha256(cfg.secret, cfg.pub_key)
    }

    // 创建客户端
    createClient(
      {
        bot_id: cfg.bot_id,
        bot_secret: cfg.secret,
        callback_port: cfg.port ?? 8080,
        callback_url: cfg.url ?? '/api/mys/callback'
      },
      callBackByVilla,
      async () => {
        console.info('VILLA Welcome back')
      }
    )
    return true
  }
  return false
}
