import { checkRobotByQQ } from './login.js'
import { BOTCONFIG } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import { createClient, getIntentsMask } from './sdk/index.js'
export async function createAlemonByNtqq() {
  if (
    await checkRobotByQQ().catch(err => {
      console.error(err)
      return false
    })
  ) {
    // 读取配置
    const cfg = BOTCONFIG.get('ntqq')
    const intents = getIntentsMask(cfg.intents)
    // 创建客户端
    await createClient(
      {
        appID: cfg.appID,
        token: cfg.token,
        secret: cfg.secret,
        intents: intents,
        isPrivate: cfg.isPrivate,
        sandbox: cfg.sandbox,
        shard: cfg?.shard ?? [0, 1]
      },
      conversation
    )
    return true
  }
  return false
}
// 客户端
export { ClientNTQQ } from './sdk/index.js'
