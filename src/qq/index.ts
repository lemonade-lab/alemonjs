import './alemon/console.js'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { setBotConfig } from 'qq-channel'
import { checkRobotByQQ } from './login.js'
import { createConversationByQQ } from './alemon/conversation.js'
import { getBotConfigByKey } from '../config/index.js'
declare global {
  var clientApiByQQ: IOpenAPI
}
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
    const cfg = getBotConfigByKey('qq')
    /**
     * 创建 clientApiByQQ
     */
    global.clientApiByQQ = createOpenAPI(cfg)

    /**
     * 设置 qq-channal 配置
     */
    setBotConfig({
      token: cfg.token,
      appID: cfg.appID,
      intents: cfg.intents,
      secret: '',
      sandbox: cfg.sandbox
    })

    /**
     * 创建 websocket
     */
    const WebsocketClient = createWebsocket(cfg)
    /**
     * 创建 conversation
     */
    createConversationByQQ(WebsocketClient)
    return true
  }
  return false
}
