import './consolog'
import '../db/redis'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { download, checkRobot, BotConfigType, createApi } from 'alemon'
import { EventEmitter } from 'ws'
import { createConversation } from './conversation'
import { AppConfig, defaultConfigLoginPath, configLoginPath } from '../config'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人配置
  var cfg: BotConfigType
}

export async function createAlemon(val?: number) {
  // 下载puppeteer
  await download(AppConfig.PuPcf.chromePath, AppConfig.PuPcf.downloadPath)
  //  登录
  global.cfg = await checkRobot(defaultConfigLoginPath, configLoginPath, val)
  console.info('[HELLO] 欢迎使用Alemon-Bot ~ ')
  console.info('[DOCS] http://three-point-of-water.gitee.io/alemon-bot')
  console.info('[GIT] https://github.com/ningmengchongshui/alemon-bot')
  if (cfg.sandbox) {
    console.info('[SDK] https://bot.q.qq.com/wiki/develop/nodesdk/')
    console.info('[API] https://bot.q.qq.com/wiki/develop/api/')
  }
  // 创建 client
  global.client = createOpenAPI(cfg)
  // 创建 websocket 连接
  global.ws = createWebsocket(cfg)
  // 创建api
  createApi(cfg)
  /* 创建会话 */
  createConversation()
}
