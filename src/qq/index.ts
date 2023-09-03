import './alemon/console.js'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { checkRobotByQQ } from './login.js'
import { createConversationByQQ } from './alemon/conversation.js'
import { getBotConfigByQQ, Login_qq } from './config.js'
declare global {
  var clientApiByQQ: IOpenAPI
}
export async function createAlemonByQQ() {
  /**
   * 登录
   */
  await checkRobotByQQ(Login_qq).catch(err => {
    console.error(err)
    process.exit()
  })
  /**
   * 读取配置
   */
  const cfg = getBotConfigByQQ()
  /**
   * 创建 clientApiByQQ
   */
  global.clientApiByQQ = createOpenAPI(cfg)
  /**
   * 创建 websocket
   */
  const WebsocketClient = createWebsocket(cfg)
  /**
   * 创建 conversation
   */
  createConversationByQQ(WebsocketClient)
}
