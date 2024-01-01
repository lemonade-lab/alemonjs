import { checkRobotByVilla } from './login.js'
import { hmacSha256, createClient } from './sdk/index.js'
import { BOTCONFIG } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
export async function createAlemonByVilla() {
  // 登录
  if (
    await checkRobotByVilla().catch(err => {
      console.error(err)
      return false
    })
  ) {
    // 读取配置
    const cfg = BOTCONFIG.get('villa')
    if ((cfg.pub_key ?? '') != '') {
      cfg.secret = hmacSha256(cfg.secret, cfg.pub_key)
    }
    await createClient(
      {
        bot_id: cfg.bot_id,
        bot_secret: cfg.secret,
        pub_key: cfg.pub_key,
        villa_id: cfg.villa_id,
        token: `${cfg.villa_id}.${cfg.secret}.${cfg.bot_id}`
      },
      conversation
    )
    return true
  }
  return false
}
// 客户端
export { ClientVILLA } from './sdk/index.js'
