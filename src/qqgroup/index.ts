import { checkRobot } from './login.js'
import { login_qqgroup, getBotConfigQQGroup } from './config.js'
import { createLogin } from './icqq/login.js'
import { PUBLIC_MESSAGESByQQGroup } from './alemon/message/PUBLIC_MESSAGES.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemonQQByQQGroup() {
  /**
   * 登录
   */
  if (
    await checkRobot(login_qqgroup).catch(err => {
      console.error(err)
    })
  ) {
    /**
     * 创建配置
     */
    const cfg = getBotConfigQQGroup()
    /**
     * 创建登录
     */
    createLogin(cfg.account, cfg.password, cfg.device, PUBLIC_MESSAGESByQQGroup)
    return true
  }
  return false
}
