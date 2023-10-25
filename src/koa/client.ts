import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import { mkdirSync } from 'fs'
import { getLocalImg } from './img.js'
import { ServerOptions } from './types.js'
import { getServerConfig, setServerCoinfg } from './config.js'

/**
 * 创建客户端
 * @param param0
 * @param callBack
 * @param logFnc
 */
export function createWeb(
  val?: ServerOptions,
  logFnc?: (port: number) => Promise<void>
) {
  if (val) {
    for (const item in val) {
      setServerCoinfg(item as keyof ServerOptions, val[item])
    }
  }
  // 创建 Koa 应用
  const app = new Koa()
  const router = new Router()

  // 处理 POST 请求体中的 JSON 数据
  app.use(bodyParser())

  const imgDir = getServerConfig('imgDir')
  const imgRouter = getServerConfig('imgRouter')
  // 确保目录存在
  mkdirSync(imgDir, { recursive: true })
  mkdirSync(imgRouter, { recursive: true })

  // 处理图片请求
  router.get(`${imgRouter}/:filename`, getLocalImg)

  const port = getServerConfig('port')
  // 将路由注册到应用
  app.use(router.routes())
  app.use(router.allowedMethods())

  // 端口
  let currentPort = port
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
    // 设置配置
    setServerCoinfg('port', port)
    // 启动应用
    app
      .listen(port, async () => {
        if (logFnc) await logFnc(port)
        console.info('[AlemonJS]', 'KOA', `http://[::]:${port}`)
      })
      .on('error', handlePortConflict)
  }

  // 启动应用
  createApp(currentPort)
}
