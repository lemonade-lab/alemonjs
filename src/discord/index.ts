import { getIntents, setDISOCRD, createClient } from './sdk/index.js'
import { conversation } from './alemon/conversation.js'
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
    /**
     * 设置配置
     */
    setDISOCRD(cfg.token, getIntents(cfg.intent))
    /**
     * 启动监听
     */
    createClient(conversation, cfg?.shard)
    return true
  }
  return false
}

// 客户端
export { ClientDISOCRD } from './sdk/index.js'