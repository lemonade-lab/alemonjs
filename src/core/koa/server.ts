import Koa from 'koa'
import Router from 'koa-router'
import { AppServerConfig } from './config.js'

class Server {
  #app: typeof Koa.prototype = null
  #currentPort = 4399
  #size = 0
  // 是否已经启动
  #state = false
  // 路由存储
  #routers: {
    [key: string]: (typeof Router.prototype)[]
  } = {}

  del() {
    this.#routers = {}
  }

  /**
   * 中间件
   */
  #middleware: any[] = []

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
    // 默认是空
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
    //
    const mid = AppServerConfig.get('middleware')
    // 中间中间件
    for (const item of mid) {
      this.#app.use(item)
    }
    // 中间间会很大,要清空
    AppServerConfig.set('middleware', [])
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
        console.info('server', `http://localhost:${port}`)
      })
      .on('error', this.#handlePortConflict)
  }
}

export const BotServer = new Server()
