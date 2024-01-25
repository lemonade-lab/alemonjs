import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import cors from 'koa2-cors'
import { AppServerConfig } from './config.js'

class Server {
  #app: typeof Koa.prototype = null
  #currentPort = 4399
  #size = 0
  // 是否已经启动
  #state = false
  #routers: {
    [key: string]: (typeof Router.prototype)[]
  } = {}
  /**
   * 推送路由
   * @param val
   */
  push(key: string, val: typeof Router.prototype) {
    if (!this.#routers[key]) this.#routers[key] = []
    this.#routers[key].push(val)
  }
  /**
   * 查看状态
   * @returns
   */
  getState() {
    return this.#state
  }

  /**
   * 判断是否有路由
   * @returns
   */
  isE() {
    let t = false
    for (const item in this.#routers) {
      if (this.#routers[item].length != 0) {
        t = true
        break
      }
    }
    return this.#routers
  }

  /**
   * 启动
   */
  connect() {
    this.#app = new Koa()
    const options = AppServerConfig.get('options')
    if (options) {
      // 允许跨域请求
      this.#app.use(cors(options))
    } else {
      // 允许跨域请求
      this.#app.use(cors())
    }
    // 处理 POST 请求体中的 JSON 数据
    this.#app.use(bodyParser())
    // 推送路由
    for (const item in this.#routers) {
      for (const router of this.#routers[item]) {
        // 路由
        this.#app.use(router.routes())
        this.#app.use(router.allowedMethods())
      }
    }
    // 启动端口
    this.#listen(AppServerConfig.get('port'))
  }

  /**
   * 寻找端口
   * @param err
   * @returns
   */
  #handlePortConflict(err: { code: string }) {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `port ${this.#currentPort} occupied, attempting to start a new port...`
      )
      this.#currentPort++
      this.#size++
      if (this.#size >= 5) {
        console.error('find port err')
        return
      }
      this.#listen(this.#currentPort)
    } else {
      console.error('An error occurred while starting the #application', err)
    }
  }

  // 监听
  #listen(port: number) {
    this.#currentPort = port
    this.#app
      .listen(port, async () => {
        AppServerConfig.set('port', port)
        // 只要启动成功
        this.#state = true
        console.info('server', `http://[::]:${port}`)
      })
      .on('error', this.#handlePortConflict)
  }
}

export const BotServer = new Server()
