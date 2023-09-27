import './alemon/console.js'
import { checkRobotByQQ } from './login.js'
import { getBotConfigByKey } from '../login.js'
import { callback } from './alemon/conversation.js'

export async function createAlemonByQQ() {
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

    // 设置配置

    // callback

    return true
  }
  return false
}
