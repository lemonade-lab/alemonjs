import ws from 'ws'
import {
  MESSAGES_TYPE,
  DIRECT_MESSAGE_TYPE,
  meta_event_lifecycle,
  meta_event_heartbeat
} from './type'

type OneBotEventMap = {
  DIRECT_MESSAGE: DIRECT_MESSAGE_TYPE
  MESSAGES: MESSAGES_TYPE
  META: meta_event_lifecycle | meta_event_heartbeat
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
        if (!event) {
          if (this.#events['ERROR']) this.#events['ERROR'](event)
          return
        } else if (event?.post_type == 'meta_event') {
          if (this.#events['META']) this.#events['META'](event)
          return
        } else if (event?.post_type == 'message') {
          if (event?.message_type == 'group') {
            if (this.#events['MESSAGES']) this.#events['MESSAGES'](event)
          } else if (event?.message_type == 'private') {
            if (this.#events['DIRECT_MESSAGE']) this.#events['DIRECT_MESSAGE'](event)
          } else {
            console.info('未知消息类型', event)
          }
          return
        } else if (event?.post_type == 'notice') {
          console.info('暂未处理事件', event)
          return
        } else if (event?.post_type == 'request') {
          console.info('暂未处理事件', event)
          return
        } else {
          console.info('未知事件', event)
          return
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
    return this.#ws.send(
      JSON.stringify({
        action: 'send_group_msg',
        params: options,
        echo: '1234'
      })
    )
  }

  /**
   * @param options
   * @returns
   */
  sendPrivateMessage(options: { user_id: number; message: any[] }) {
    return this.#ws.send(
      JSON.stringify({
        action: 'send_private_msg',
        params: options,
        echo: '1234'
      })
    )
  }

  //
}
