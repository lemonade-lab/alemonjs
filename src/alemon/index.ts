import './consolog'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { BotConfigType } from 'alemon'
import { ctreateRedis } from '../db/redis'
import { download, checkRobot } from 'alemon'
import { EventEmitter } from 'ws'
import { createConversation } from './conversation'
import { PuPcf, Dcf, Bcf } from '../../app.config'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //配置
  var cfg: BotConfigType
}

export async function createAlemon(val?: number) {
  // 下载puppeteer
  await download(PuPcf.chromePath, PuPcf.downloadPath)
  /* 启动redis数据库 */
  await ctreateRedis()
  //  登录
  global.cfg = await checkRobot(Dcf, Bcf, val)
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
