import './consolog'
import '../db/redis'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { BotConfigType } from 'alemon'
import { download, checkRobot } from 'alemon'
import { EventEmitter } from 'ws'
import { createConversation } from './conversation'
import { AppConfig } from './config'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //配置
  var cfg: BotConfigType
}

const defaultConfigPath = 'config_default/login.yaml'

const configPath = 'config/login.yaml'

export async function createAlemon(val?: number) {
  // 下载puppeteer
  await download(AppConfig.PuPcf.chromePath, AppConfig.PuPcf.downloadPath)
  //  登录
  global.cfg = await checkRobot(defaultConfigPath, configPath, val)
  console.info('[HELLO] 欢迎使用Alemon-Bot ~ ')
  console.info('[DOCS] http://three-point-of-water.gitee.io/alemon-bot')
  console.info('[GIT] https://github.com/ningmengchongshui/alemon-bot')
  if (global.cfg.sandbox) {
    console.info('[SDK] https://bot.q.qq.com/wiki/develop/nodesdk/')
    console.info('[API] https://bot.q.qq.com/wiki/develop/api/')
  }
  // 创建 client
  global.client = createOpenAPI(global.cfg)
  // 创建 websocket 连接
  global.ws = createWebsocket(global.cfg)
  /* 创建会话 */
  createConversation()
}
