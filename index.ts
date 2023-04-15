import { createOpenAPI, createWebsocket, IOpenAPI } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { download } from './src/lib/tool'
import { check } from './src/lib/login'
import { redisInit } from './src/db/redis/index'
import { createConversation } from './src/lib/conversation'
import { green, red } from 'kolorist'
declare global {
  var client: IOpenAPI
  var ws: EventEmitter
}
;(async function run(): Promise<void> {
  console.info(green('[HELLO]'), ' 欢迎使用Alemon-Bot ~ ')

  /* 启动redis数据库 */
  redisInit()
    .then(() => {
      console.info(green('[REIDS]'), ' OK ')
    })
    .catch(err => {
      console.info(red('[REIDS]'), err)
    })

  // 下载puppeteer
  await download()

  //  登录
  await check()

  // 创建 client
  global.client = createOpenAPI(cfg)

  // 创建 websocket 连接
  global.ws = createWebsocket(cfg)

  /* 创建会话 */
  createConversation()
})()
