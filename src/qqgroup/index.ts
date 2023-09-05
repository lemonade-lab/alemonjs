import { checkRobot } from './login.js'
import { login_qqgroup, getBotConfigQQGroup, setup_qqgroup } from './config.js'
import { createLogin } from './icqq/login.js'
import { PUBLIC_MESSAGESByQQGroup } from './alemon/message/PUBLIC_MESSAGES.js'
import { createYaml } from '../config.js'
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
    const str = `friendApplication: false # 好友申请
groupInvitation: false # 邀群申请
addGroupApplication: false # 加群申请
botQQ: [] # 被视为bot的QQ号,当对方是bot时反馈`
    createYaml(setup_qqgroup, str)
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
