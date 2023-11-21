import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import { createClient, setTimeoutBotConfig } from './sdk/index.js'

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
      secret: cfg.secret
    })

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
