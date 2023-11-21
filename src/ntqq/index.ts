import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import {
  createClient,
  setTimeoutBotConfig,
  getIntentsMask
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

    if (cfg.mode == 'qq-guild') {
      //
    } else {
      /**
       * token
       * group是刷新的
       * qq的是固定的
       */

      /**
       * 鉴权刷新
       */
      setTimeoutBotConfig({
        appID: cfg.appID,
        token: cfg.token,
        secret: cfg.secret,
        intents: getIntentsMask(cfg.intents),
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
