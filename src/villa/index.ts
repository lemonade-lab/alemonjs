import { checkRobotByVilla } from './login.js'
import { hmacSha256 } from './sdk/index.js'
import { getBotConfigByKey } from '../config/index.js'
import { createClientWS } from './sdk/wss.js'
import { setClientConfig } from './sdk/config.js'

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
    setClientConfig({
      bot_id: cfg.bot_id,
      bot_secret: cfg.secret,
      callback_url: '/api/mys/callback',
      callback_port: 8080
    })
    createClientWS()
    return true
  }
  return false
}
// 客户端
export { ClientVILLA } from './sdk/index.js'
