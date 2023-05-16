import './src/lib/consolo'
import { BotConfigType } from './src/lib/types'
import { download } from './src/lib/puppeteer'
import { ctreateRedis } from './src/db/redis/index'
import { check } from './src/lib/login'
import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { createConversation } from './src/lib/conversation'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //配置
  var cfg: BotConfigType
}
{
  ;(async function run() {
    /* 启动redis数据库 */
    ctreateRedis()
    // 下载puppeteer
    await download()
    //  登录
    await check()
    console.info('[HELLO] 欢迎使用Alemon-Bot ~ ')
    console.info('[DOCS] http://three-point-of-water.gitee.io/point')
    console.info('[GIT] https://github.com/ningmengchongshui')
    if (cfg.sandbox) {
      console.info('[SDK] https://bot.q.qq.com/wiki/develop/nodesdk/')
      console.info('[API] https://bot.q.qq.com/wiki/develop/api/')
    }
    // 创建 client
    global.client = createOpenAPI(cfg)
    // 创建 websocket 连接
    global.ws = createWebsocket(cfg)
    /* 创建会话 */
    createConversation()
  })().catch(err => {
    console.error(err)
  })
}
