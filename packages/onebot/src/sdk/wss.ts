import ws from 'ws'

type OneBotEventMap = {
  DIRECT_MESSAGE: any
  MESSAGES: {
    detail_type: 'private' | 'group'
    user_id: string
    group_id: string
    group_name: string
    message_id: string
    raw_message: string
    platform: string
    sender: {
      nickname: string
    }
    message: any[]
  }
  META: any
  ERROR: any
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

  #ws: ws

  #events: {
    [K in keyof OneBotEventMap]?: (event: OneBotEventMap[K]) => any
  } = {}

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

    this.#ws = new ws(url, c)

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
   * @param guild_id
   * @param message
   * @returns
   */
  postMessage(guild_id, message: any[]) {
    return this.#ws.send(
      JSON.stringify({
        action: 'send_group_msg',
        params: {
          group_id: guild_id,
          message: message
        },
        echo: '1234'
      })
    )
  }
}
