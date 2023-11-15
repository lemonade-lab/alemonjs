import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import { mkdirSync } from 'fs'
import { getLocalImg } from './img.js'
import { ServerOptions } from './types.js'
import { getServerConfig, setServerCoinfg } from './config.js'
import { join } from 'path'

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

  // 允许跨域请求
  app.use(cors())

  // 处理 POST 请求体中的 JSON 数据
  app.use(bodyParser())

  // 确保目录存在
  const imgDir = getServerConfig('imgDir')
  mkdirSync(join(process.cwd(), imgDir), { recursive: true })

  // 处理图片请求
  const imgRouter = getServerConfig('imgRouter')
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
      console.error(
        `port ${currentPort} occupied, attempting to start a new port...`
      )
      currentPort++
      size++
      if (size >= 10) {
        console.error('find port err')
        return
      }
      createApp(currentPort)
    } else {
      console.error('An error occurred while starting the application', err)
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
        console.info('server', `http://[::]:${port}`)
      })
      .on('error', handlePortConflict)
  }

  // 启动应用
  createApp(currentPort)
}
