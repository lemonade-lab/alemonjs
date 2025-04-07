import WebSocket, { WebSocketServer } from 'ws'
import { randomUUID } from 'crypto'
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
  REQUEST_ADD_FRIEND: any
  REQUEST_ADD_GROUP: any
  NOTICE_GROUP_MEMBER_INCREASE: any
  NOTICE_GROUP_MEMBER_REDUCE: any
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
    access_token: '',
    reverse_enable: false,
    reverse_port: 17158
  }

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: {
    url: string
    access_token: string
    reverse_enable: boolean
    reverse_port: number
  }) {
    for (const key in opstion) {
      if (Object.prototype.hasOwnProperty.call(opstion, key)) {
        this.#options[key] = opstion[key]
      }
    }
  }

  #ws: WebSocket | null = null

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
    const { url, access_token: token, reverse_enable, reverse_port } = this.#options

    const c =
      token == '' || !token
        ? {}
        : {
            headers: {
              ['Authorization']: `Bearer ${token}`
            }
          }

    const onMessage = async data => {
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
          }
          return
        } else if (event?.post_type == 'notice') {
          if (event?.notice_type == 'group_increase') {
            // 群成员增加
            if (this.#events['NOTICE_GROUP_MEMBER_INCREASE'])
              this.#events['NOTICE_GROUP_MEMBER_INCREASE'](event)
          } else if (event?.notice_type == 'group_decrease') {
            // 群成员减少
            if (this.#events['NOTICE_GROUP_MEMBER_REDUCE'])
              this.#events['NOTICE_GROUP_MEMBER_REDUCE'](event)
          }
          return
        } else if (event?.post_type == 'request') {
          // 收到加群 或 加好友的请求。
          if (event?.request_type == 'friend') {
            if (this.#events['REQUEST_ADD_FRIEND']) this.#events['REQUEST_ADD_FRIEND'](event)
          } else if (event?.request_type == 'group') {
            if (this.#events['REQUEST_ADD_GROUP']) this.#events['REQUEST_ADD_GROUP'](event)
          }
          return
        } else if (
          event?.echo === 'get_friend_list' ||
          event?.echo === 'get_group_list' ||
          event?.echo === 'get_group_member_list'
        ) {
          // 处理获取好友列表和群列表的响应
          // if (this.#events['META']) this.#events['META'](event)
          // console.debug('响应', event)
          return
        }

        if (!event?.post_type && event?.echo && this.#echo[event?.echo]) {
          if (![0, 1].includes(event?.retcode))
            this.#echo[event?.echo].reject(
              Object.assign(this.#echo[event?.echo].request, { error: event })
            )
          else
            this.#echo[event?.echo].resolve(
              event?.data
                ? new Proxy(event, {
                    get: (target, prop) => target.event[prop] ?? target[prop]
                  })
                : event
            )
          clearTimeout(this.#echo[event?.echo].timeout)
          delete this.#echo[event?.echo]
        }
      } catch (err) {
        if (this.#events['ERROR']) this.#events['ERROR'](err)
      }
    }

    const onClose = (code, reason) => {
      if (this.#events['ERROR'])
        this.#events['ERROR']({
          de: code,
          reason: reason.toString('utf8')
        })
    }

    if (!this.#ws) {
      if (reverse_enable) {
        // reverse_open
        const server = new WebSocketServer({ port: reverse_port ?? 17158 })
        server.on('connection', ws => {
          this.#ws = ws
          // message
          this.#ws.on('message', onMessage)
          // close
          this.#ws.on('close', onClose)
          console.info('connected: ws://127.0.0.1:' + reverse_port)
        })
      } else {
        // forward_open
        this.#ws = new WebSocket(url, c)
        this.#ws.on('open', () => {
          console.debug(`open:${url}`)
        })
        // message
        this.#ws.on('message', onMessage)
        // close
        this.#ws.on('close', onClose)
      }
    }
  }

  /**
   * 发送私聊消息
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
   * 发送群消息
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
   * 发送消息
   * @param options
   * @returns
   */
  sendMessage(options: {
    message_type: 'private' | 'group'
    group_id?: number
    user_id?: number
    message: any[]
  }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'send_msg',
        params: options,
        echo: randomUUID()
      })
    )
  }

  /**
   * 好友列表
   */
  getFriendList() {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'get_friend_list',
        params: {},
        echo: 'get_friend_list'
      })
    )
  }

  /**
   * 群列表
   */
  getGroupList() {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'get_group_list',
        params: {},
        echo: 'get_group_list'
      })
    )
  }

  /**
   * 群成员列表
   * @param options
   * @returns
   */
  getGroupMemberList(options: { group_id: number }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'get_group_member_list',
        params: options,
        echo: 'get_group_member_list'
      })
    )
  }

  /**
   * 处理好友请求
   * @param options
   * @returns
   */
  setFriendAddRequest(options: { flag: string; approve: boolean; remark?: string }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'set_friend_add_request',
        params: options,
        echo: randomUUID()
      })
    )
  }

  /**
   * 处理群请求
   * @param options
   * @returns
   */
  setGroupAddRequest(options: {
    flag: string
    sub_type: string
    approve: boolean
    reason?: string
  }) {
    if (!this.#ws) return
    return this.#ws.send(
      JSON.stringify({
        action: 'set_group_add_request',
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
