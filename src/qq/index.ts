import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { setBotConfig as setBotQQConfig } from './sdk/index.js'
import { checkRobotByQQ } from './login.js'
import { createConversationByQQ } from './alemon/conversation.js'
import { getBotConfigByKey } from '../config/index.js'
declare global {
  var ClientQQ: IOpenAPI
}
export async function createAlemonByQQ() {
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
    const cfg = getBotConfigByKey('qq')
    /**
     * 创建 ClientQQ
     */
    global.ClientQQ = createOpenAPI({
      appID: cfg.appID,
      token: cfg.token,
      sandbox: cfg.sandbox ?? false
    })

    /**
     * 设置 qq-channal 配置
     */
    setBotQQConfig({
      token: cfg.token,
      appID: cfg.appID,
      intents: cfg.intents,
      secret: '',
      sandbox: cfg.sandbox
    })

    /**
     * 创建 websocket
     */
    const WebsocketClient = createWebsocket({
      appID: cfg.appID,
      token: cfg.token,
      sandbox: cfg.sandbox,
      intents: cfg.intents
    })

    /**
     * 创建 conversation
     */
    createConversationByQQ(WebsocketClient)
    return true
  }
  return false
}
// 客户端
export const ClientQQ = global.ClientQQ
