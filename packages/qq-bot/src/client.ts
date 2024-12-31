import { QQBotAPI } from './api.js'
import { QQBotEventMap } from './message.js'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'
import { WebhookAPI } from './webhook.js'
import Koa from 'koa'
import { config } from './config.js'
import { v4 as uuidv4 } from 'uuid'
import { WebSocket, WebSocketServer } from 'ws'
import { Opstion } from './typings'

type Data = {
  op: number
  id: string
  d: {
    event_ts: string
    plain_token: string
  }
  t: string
}

export class QQBotClient extends QQBotAPI {
  #events: {
    [K in keyof QQBotEventMap]?: ((event: QQBotEventMap[K]) => any)[]
  } = {}
  #app: Koa<Koa.DefaultState, Koa.DefaultContext> | null = null
  #count = 0
  #client: {
    id: string
    ws: WebSocket
  }[] = []
  #ws: WebSocket | null = null

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: Opstion) {
    super()
    if (opstion.secret) config.set('secret', opstion.secret)
    if (opstion.app_id) config.set('app_id', opstion.app_id)
    if (opstion.token) config.set('token', opstion.token)
    if (opstion.port) config.set('port', opstion.port)
    if (opstion.ws) config.set('ws', opstion.ws)
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotEventMap>(key: T, val: (event: QQBotEventMap[T]) => any) {
    if (!this.#events[key]) {
      this.#events[key] = []
    }
    this.#events[key].push(val)
    return this
  }

  /**
   *
   * @param cfg
   * @param conversation
   */
  connect() {
    try {
      this.#app = new Koa()
      this.#app.use(bodyParser())
      const router = new Router()
      const port = config.get('port')
      const secret = config.get('secret')
      const cfg = {
        secret: secret ?? '',
        port: port ? Number(port) : 17157
      }
      const ntqqWebhook = new WebhookAPI({
        secret: cfg.secret
      })
      this.#app.use(async (ctx, next) => {
        let rawData = ''
        ctx.req.on('data', chunk => (rawData += chunk))
        ctx.req.on('end', () => (ctx.request.rawBody = rawData))
        await next()
      })
      // 启动服务
      router.post('/webhook', async ctx => {
        const sign = ctx.req.headers['x-signature-ed25519']
        const timestamp = ctx.req.headers['x-signature-timestamp']
        const rawBody = ctx.request.rawBody
        const isValid = ntqqWebhook.validSign(timestamp, rawBody, String(sign))
        if (!isValid) {
          ctx.status = 400
          ctx.body = { msg: 'invalid signature' }
          return
        }
        const body = ctx.request.body as Data
        if (body.op == 13) {
          ctx.status = 200
          ctx.body = {
            // 返回明文 token
            plain_token: body.d.plain_token,
            // 生成签名
            signature: ntqqWebhook.getSign(body.d.event_ts, body.d.plain_token)
          }
        } else if (body.op == 0) {
          ctx.status = 204
          console.log('body', body.d)
          // 根据事件类型，处理事件
          for (const event of this.#events[body.t] || []) {
            event(body.d)
          }
          // 也可以分法到客户端。 发送失败需要处理 或清理调
          for (const client of this.#client) {
            try {
              client.ws.send(JSON.stringify(body.d))
            } catch (e) {
              this.#error(e)
            }
          }
        }
      })
      this.#app.use(router.routes())
      this.#app.use(router.allowedMethods())

      // 启动服务
      const server = this.#app.listen(cfg.port, () => {
        console.log('Server running at http://localhost:' + cfg.port + '/webhook')
      })

      // 创建 WebSocketServer 并监听同一个端口
      const wss = new WebSocketServer({ server: server })

      // 处理客户端连接
      wss.on('connection', ws => {
        const clientId = uuidv4()
        ws['clientId'] = clientId
        console.log(clientId, 'connection')
        this.#client.push({ id: clientId, ws })
        // 处理消息事件
        ws.on('message', (message: string) => {
          // 拿到消息
          try {
            const body: Data = JSON.parse(message.toString())
            for (const event of this.#events[body.t] || []) {
              event(body)
            }
          } catch (e) {
            this.#error(e)
          }
        })
        // 处理关闭事件
        ws.on('close', () => {
          console.log(`Client ${clientId} disconnected`)
          this.#client = this.#client.filter(client => client.id !== clientId)
        })
      })

      const reconnect = () => {
        const ws = config.get('ws')
        if (!ws) return
        // 使用了ws服务器
        this.#ws = new WebSocket(ws)
        this.#ws.on('open', () => {
          this.#count = 0
          console.log('ws connected')
        })
        this.#ws.on('message', data => {
          try {
            // 拿到消息
            const body: Data = JSON.parse(data.toString())
            for (const event of this.#events[body.t] || []) {
              event(body)
            }
          } catch (e) {
            this.#error(e)
          }
        })
        this.#ws.on('close', () => {
          console.log('ws closed')
          // 重连5次，超过5次不再重连
          if (this.#count > 5) return
          // 23s 后重连
          setTimeout(() => {
            reconnect()
          }, 23000)
        })
        this.#ws.on('error', e => {
          this.#error(e)
        })
      }

      reconnect()
    } catch (e) {
      this.#error(e)
    }
  }

  /**
   *
   * @param error
   */
  #error(error) {
    if (this.#events['ERROR']) {
      for (const event of this.#events['ERROR'] || []) {
        event(error)
      }
    }
  }
}
