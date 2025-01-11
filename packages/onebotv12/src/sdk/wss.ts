import ws from 'ws'
import { randomUUID } from 'crypto'
import { MESSAGES_TYPE } from './type'

type OneBotEventMap = {
  DIRECT_MESSAGE: any
  MESSAGES: MESSAGES_TYPE
  META: any
  ERROR: any
}

type OneBotRequest = {
  action: string
  params?: { [key: string]: any }
  echo?: string
}

/**
 * 连接
 */
export class OneBotClient {
  #options = {
    url: '',
    access_token: ''
  }

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: { url: string; access_token: string }) {
    for (const key in opstion) {
      if (Object.prototype.hasOwnProperty.call(opstion, key)) {
        this.#options[key] = opstion[key]
      }
    }
  }

  #ws: ws | null = null

  #events: {
    [K in keyof OneBotEventMap]?: (event: OneBotEventMap[K]) => any
  } = {}

  #echo: {
    [key: string]: {
      request: OneBotRequest
      resolve: (value?: any) => void
      reject: (reason?: any) => void
      timeout: NodeJS.Timeout
    }
  } = {}

  timeout = 30000

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof OneBotEventMap>(key: T, val: (event: OneBotEventMap[T]) => any) {
    this.#events[key] = val
    return this
  }

  /**
   *
   * @param cfg
   * @param conversation
   */
  async connect() {
    const { url, access_token: token } = this.#options

    const c =
      token == '' || !token
        ? {}
        : {
            headers: {
              ['Authorization']: `Bearer ${token}`
            }
          }

    if (!this.#ws) {
      this.#ws = new ws(url, c)
    }

    // open
    this.#ws.on('open', () => {
      console.debug(`open:${url}`)
    })

    // message
    this.#ws.on('message', async data => {
      try {
        const event = JSON.parse(data.toString())
        if (event) {
          if (event?.type == 'meta' && this.#events['META']) {
            if (event.status && event.status.bots) {
              this.#events['META'](event)
            }
          } else if (event?.type == 'message') {
            if (event.detail_type == 'private' && this.#events['DIRECT_MESSAGE']) {
              await this.#events['DIRECT_MESSAGE'](event)
            } else if (event.detail_type != 'private' && this.#events['MESSAGES']) {
              await this.#events['MESSAGES'](event)
            } else {
              //
            }
          }
          if (!event?.type && event?.echo && this.#echo[event?.echo]) {
            /**
             * @todo 失败逻辑
             */
            clearTimeout(this.#echo[event?.echo].timeout)
            delete this.#echo[event?.echo]
          }
        } else {
          if (event?.status != 'ok') {
            if (this.#events['ERROR']) this.#events['ERROR'](event)
          }
        }
      } catch (err) {
        if (this.#events['ERROR']) this.#events['ERROR'](err)
      }
    })

    // close
    this.#ws.on('close', (code, reason) => {
      if (this.#events['ERROR'])
        this.#events['ERROR']({
          de: code,
          reason: reason.toString('utf8')
        })
    })
  }

  /**
   *
   * @param options
   * @returns
   */
  sendGroupMessage(options: { group_id: number; message: any[] }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'send_group_msg',
        params: options,
        echo: randomUUID()
      })
    )
  }

  /**
   * @param options
   * @returns
   */
  sendPrivateMessage(options: { user_id: number; message: any[] }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'send_private_msg',
        params: options,
        echo: randomUUID()
      })
    )
  }

  /**
   * @param options
   * @returns
   */
  sendApi(options: { action: string; params?: { [key: string]: any }; echo?: string }) {
    if (!this.#ws) return
    if (!options.echo) options.echo = randomUUID()
    this.#ws.send(JSON.stringify(options))
    return new Promise(
      (resolve, reject) =>
        (this.#echo[options.echo as string] = {
          request: options,
          resolve,
          reject,
          timeout: setTimeout(() => {
            reject(Object.assign(options, { timeout: this.timeout }))
            delete this.#echo[options.echo as string]
            console.error('请求超时:', options)
          }, this.timeout)
        })
    )
  }
}
