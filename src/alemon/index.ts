import './console.js'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { checkRobot, BotConfigType, createApi, setLanchConfig } from 'alemon'
import { EventEmitter } from 'ws'
import { createConversation } from './conversation.js'
import { DefaultConfigLogin, ConfigLogin, PuppeteerConfig } from '../config/index.js'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人配置
  var cfg: BotConfigType
}

export async function createAlemon() {
  // 设置浏览器配置
  setLanchConfig(PuppeteerConfig)
  //  登录
  global.cfg = await checkRobot(DefaultConfigLogin, ConfigLogin, process.argv[2] == 'login' ? 0 : 1)
  console.info('[HELLO] 欢迎使用Alemon-Bot ~ ')
  console.info('[DOCS] http://ningmengchongshui.gitee.io/lemonade')
  console.info('[GIT] https://github.com/ningmengchongshui/alemon-bot')
  if (cfg.sandbox) {
    console.info('[SDK] https://bot.q.qq.com/wiki/develop/nodesdk/')
    console.info('[API] https://bot.q.qq.com/wiki/develop/api/')
  }
  // 创建 client
  global.client = createOpenAPI(cfg)
  // 创建 websocket
  global.ws = createWebsocket(cfg)
  // 创建 api
  createApi(cfg)
  // 创建 conversation
  createConversation()
}
