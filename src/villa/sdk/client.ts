import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import { mkdirSync } from 'fs'
import { getLocalImg } from './img.js'
import { type ClientConfig, type BotEvent } from './types.js'
import { setClientConfig } from './config.js'

/**
 * 创建客户端
 * @param param0
 * @param callBack
 * @param logFnc
 */
export function createClient(
  {
    bot_id,
    bot_secret,
    callback_url = '/api/mys/callback',
    callback_port = 8080,
    img_size = 9999999,
    img_url = '/api/mys/img',
    IMAGE_DIR = '/data/mys/img'
  }: ClientConfig,
  callBack: (event: BotEvent) => Promise<void>,
  logFnc?: (port: number) => Promise<void>
) {
  /**
   * 创建 Koa 应用
   */
  const app = new Koa()
  const router = new Router()

  /**
   * 处理 POST 请求体中的 JSON 数据
   */
  app.use(bodyParser())

  /**
   * 确保目录存在
   */
  mkdirSync(IMAGE_DIR, { recursive: true })
  mkdirSync(img_url, { recursive: true })

  /**
   * 处理图片请求
   */
  router.get(`${img_url}/:filename`, getLocalImg)

  /**
   * 处理事件回调请求
   */
  router.post(callback_url, async ctx => {
    try {
      /**
       * 从请求体中获取事件对象
       */
      const event: BotEvent = ctx.request.body.event
      /**
       * 错误调用
       */
      if (!event?.robot) {
        /**
         * 处理完毕后返回响应
         */
        ctx.body = { message: '错误回调', retcode: 0 }
        return
      }
      await callBack(event).catch(err => {
        console.error('回调出错')
        console.error(err)
      })
    } catch (err) {
      console.error(err)
      /**
       * 处理完毕后返回响应
       */
      ctx.body = { message: '执行错误', retcode: 0 }
      return
    }
    // 处理完毕后返回响应
    ctx.body = { message: '处理完成', retcode: 0 }
  })

  /**
   * 将路由注册到应用
   */
  app.use(router.routes())
  app.use(router.allowedMethods())

  let currentPort = callback_port
  let size = 0

  /**
   * 错误处理
   * @param err
   * @returns
   */
  function handlePortConflict(err: { code: string }) {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${currentPort} 被占用，尝试启动新的端口...`)
      currentPort++
      size++
      if (size >= 10) {
        console.log('寻端失败~')
        return
      }
      createApp(currentPort)
    } else {
      console.error('启动应用程序时发生错误：', err)
    }
  }

  /**
   * 创建应用
   * @param port
   */
  function createApp(port: number) {
    /**
     * 设置配置
     */
    setClientConfig({
      bot_id,
      bot_secret,
      callback_url,
      callback_port: port,
      img_url,
      img_size,
      IMAGE_DIR
    })

    /**
     * 启动应用
     */
    app
      .listen(port, async () => {
        if (logFnc) {
          await logFnc(port)
        }
      })
      .on('error', handlePortConflict)
  }

  /**
   * 启动应用
   */
  createApp(currentPort)
}
