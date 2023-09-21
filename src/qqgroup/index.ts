import { checkRobot } from './login.js'
import { createLogin } from './icqq/login.js'
import { PUBLIC_MESSAGESByQQGroup } from './alemon/message/PUBLIC_MESSAGES.js'
import { getBotConfigByKey } from '../login.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemonQQByQQGroup() {
  /**
   * 登录
   */
  if (
    await checkRobot().catch(err => {
      console.error(err)
    })
  ) {
    /**
     * 创建配置
     */
    const cfg = getBotConfigByKey('qqgroup')
    /**
     * 创建登录
     */
    createLogin(cfg.account, cfg.password, cfg.device, PUBLIC_MESSAGESByQQGroup)
    return true
  }
  return false
}
