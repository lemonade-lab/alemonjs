import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import { type ClientConfig, type BotEvent } from './types.js'
import { setClientConfig } from './config.js'
import { getIP } from '../../core/index.js'

/**
 * tudo
 * 需要验证登录是否成功
 */

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
    callback_port = 8080
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
      console.error(`端口 ${currentPort} 被占用，尝试启动新的端口...`)
      currentPort++
      size++
      if (size >= 10) {
        console.error('寻端失败~')
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
      callback_port: port
    })

    /**
     * 启动应用
     */
    app
      .listen(port, async () => {
        if (logFnc) {
          await logFnc(port)
        }

        // 获取ip4
        const ip = await getIP()
        if (ip) {
          console.info(
            '[VILLA OPEN]',
            `http://${ip}:${port ?? 8080}${callback_url ?? '/api/mys/callback'}`
          )
        } else {
          console.error('[VILLA] 公网IP识别失败,无法支持运行')
          return
        }
      })
      .on('error', handlePortConflict)
  }

  /**
   * 启动应用
   */
  createApp(currentPort)
}
