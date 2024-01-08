import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { config } from './sdk/index.js'
import { checkRobotByQQ } from './login.js'
import { createConversationByQQ } from './alemon/conversation.js'
import { BOTCONFIG } from '../config/index.js'
declare global {
  var ClientQQ: IOpenAPI
}
export async function createAlemon() {
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
    const cfg = BOTCONFIG.get('qq')
    /**
     * 创建 ClientQQ
     */
    global.ClientQQ = createOpenAPI({
      appID: cfg.appID,
      token: cfg.token,
      sandbox: cfg.sandbox ?? false
    })

    /**
     * **********
     * sdk-config
     * **********
     */
    config.set('appID', cfg.appID)
    config.set('token', cfg.token)
    config.set('intents', cfg.intents)
    config.set('sandbox', cfg.sandbox)

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
