import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import {
  createClient,
  setTimeoutBotConfig,
  getIntentsMask,
  setBotConfig
} from './sdk/index.js'
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

    const intents = getIntentsMask(cfg.intents)

    if (cfg.mode == 'qq-guild') {
      setBotConfig({
        appID: cfg.appID,
        token: cfg.token,
        secret: cfg.secret,
        intents: intents,
        isPrivate: cfg.isPrivate,
        sandbox: cfg.sandbox
      })
    } else {
      await setTimeoutBotConfig({
        appID: cfg.appID,
        token: cfg.token,
        secret: cfg.secret,
        intents: intents,
        isPrivate: cfg.isPrivate,
        sandbox: cfg.sandbox
      })
    }

    /**
     * 创建客户端
     */
    createClient(conversation, cfg?.shard ?? [0, 1])
    return true
  }
  return false
}

// 客户端
export { ClientNTQQ } from './sdk/index.js'
