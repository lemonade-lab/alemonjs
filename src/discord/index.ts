process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createClient } from './sdk/wss.js'
import { checkRobotByDISCORD } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
/**
 * 创建实例
 * @returns
 */
export async function createAlemonByDISCORD() {
  /**
   * 创建登录配置
   */
  if (
    await checkRobotByDISCORD().catch(err => {
      console.error(err)
      return false
    })
  ) {
    /**
     * 读取配置
     */
    const cfg = getBotConfigByKey('discord')

    createClient()

    return true
  }
  return false
}
