import {
  defineBot,
  getConfigValue,
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  User,
  useUserHashKey
} from 'alemonjs'
import { WebSocket, WebSocketServer } from 'ws'
import Koa from 'koa'
import KoaStatic from 'koa-static'
import { mkdirSync } from 'fs'
import { join } from 'path'
import koaBody from 'koa-bodyparser'
import { Data, DataPrivate, DataPublic } from './typing'
import {
  addChat,
  addPrivateChat,
  delChat,
  delPrivateChat,
  getChats,
  getPrivateChats
} from './chats'
export * from './typing'

const Bot = {
  BotId: '794161769',
  BotName: '阿柠檬',
  BotAvatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=794161769'
}

const DATA = {
  stringify: (data: Data) => JSON.stringify(data),
  parse: (data: string): Data => JSON.parse(data)
}

/**
 * @param port
 * @returns
 */
const createServer = (port: number) => {
  const app = new Koa()
  // 开放public文件夹
  const dir = join(process.cwd(), 'public')
  mkdirSync(join(dir, 'file'), { recursive: true })
  // 暴露public文件夹
  app.use(KoaStatic(dir))

  // body
  app.use(koaBody())

  // 监听端口
  return app.listen(port, () => {
    console.log(`gui server start at port ${port}`)
  })
}

export const platform = 'gui'

export type Client = WebSocket

export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      const original = global.client[prop]
      // 防止函数内this丢失
      return typeof original === 'function' ? original.bind(global.client) : original
    }
    return undefined
  }
})

export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  //
  const port = config?.port ?? 17127
  //
  const server = createServer(port)
  // 创建 WebSocketServer 并监听同一个端口
  const wss = new WebSocketServer({ server: server })
  //
  let client: WebSocket | null = null
  /**
   *
   * @param event
   */
  const onMessage = (data: DataPublic) => {
    const event = data.d
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: event.UserId
    })
    const url = event.UserAvatar
    const UserAvatar = {
      toBuffer: async () => {
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        return url
      }
    }

    const master_key = getConfigValue()?.gui?.master_key ?? []

    // 纯文本
    const msg = event.MessageBody.map(item => {
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    }).join('')

    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      // 频道
      GuildId: event.GuildId,
      ChannelId: event.ChannelId,
      //
      UserId: event.UserId,
      UserName: event.UserName,
      UserAvatar: UserAvatar,
      UserKey,
      IsMaster: master_key.includes(UserKey),
      IsBot: event.IsBot,
      MessageId: String(event.MessageId),
      MessageText: msg,
      OpenId: event.OpenId,
      CreateAt: Date.now(),
      //
      tag: 'send_message',
      value: null
    }
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return data
      }
    })
    // 处理消息
    OnProcessor(e, 'message.create')
  }

  const onProvateMessage = (data: DataPrivate) => {
    const event = data.d
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: event.UserId
    })

    const url = event.UserAvatar
    const UserAvatar = {
      toBuffer: async () => {
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        return url
      }
    }

    // 纯文本
    const msg = event.MessageBody.map(item => {
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    }).join('')

    const master_key = getConfigValue()?.gui?.master_key ?? []

    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event.UserId,
      UserName: event.UserName,
      UserAvatar,
      UserKey,
      IsMaster: master_key.includes(UserKey),
      IsBot: event.IsBot,
      MessageId: String(event.MessageId),
      MessageText: msg,
      OpenId: event.OpenId,
      CreateAt: Date.now(),
      //
      tag: 'send_private_message',
      value: null
    }
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return data
      }
    })
    // 处理消息
    OnProcessor(e, 'private.message.create')
  }

  // 监听连接事件
  wss.on('connection', ws => {
    console.log('gui connection')

    // 保存客户端
    client = ws

    // 处理消息事件
    ws.on('message', (message: string) => {
      try {
        const event = DATA.parse(message)
        if (event.t == 'get_channel') {
          const createAt = event.d.createAt
          const chats = getChats(createAt)
          ws.send(
            DATA.stringify({
              t: 'post_channel',
              d: chats
            })
          )
        } else if (event.t == 'get_private') {
          const createAt = event.d.createAt
          const chats = getPrivateChats(createAt)
          ws.send(
            DATA.stringify({
              t: 'post_private',
              d: chats
            })
          )
        } else if (event.t == 'del_channel') {
          delChat(event.d.createAt, event.d.MessageId)
        } else if (event.t == 'del_private') {
          delPrivateChat(event.d.createAt, event.d.MessageId)
        } else if (event.t == 'send_message') {
          // add
          addChat(event.d.createAt, event)
          onMessage(event)
        } else if (event.t == 'send_private_message') {
          // add
          addPrivateChat(event.d.createAt, event)
          onProvateMessage(event)
        } else {
          console.log('未知消息', event)
        }
      } catch (err) {
        console.error('解析消息出错', err)
      }
    })

    // 处理关闭事件
    ws.on('close', () => {
      console.log('gui close')
    })

    //
  })

  //
  return {
    api: {
      use: {
        send: (event, val) => {
          if (val.length < 0) return Promise.all([])
          const data: DataPrivate | DataPublic = event.value
          if (data.t == 'send_message') {
            if (client) {
              const db = {
                t: 'send_message' as DataPublic['t'],
                d: {
                  MessageBody: val,
                  MessageId: Date.now(),
                  createAt: Date.now(),
                  IsBot: true,
                  OpenId: data.d.OpenId,
                  GuildId: data.d.GuildId,
                  ChannelId: data.d.ChannelId
                } as any
              }
              addChat(db.d.createAt, db)
              client.send(DATA.stringify(db as any))
            }
          } else {
            if (client) {
              const db = {
                t: 'send_private_message' as DataPrivate['t'],
                d: {
                  MessageBody: val,
                  MessageId: Date.now(),
                  createAt: Date.now(),
                  IsBot: true,
                  OpenId: data.d.OpenId
                } as any
              }
              addPrivateChat(db.d.createAt, db)
              client.send(DATA.stringify(db as any))
            }
          }
          return Promise.all([])
        },
        mention: async e => {
          const event: DataPrivate | DataPublic = e.value
          if (event.t == 'send_private_message') {
            const arr: User[] = []
            return arr
          } else {
            const mentions = event.d.MessageBody.filter(
              item => item.type == 'Mention' && item.options?.belong == 'user'
            ).map(item => item.value)
            const MessageMention: User[] = mentions.map(item => {
              const UserId = item
              const value = getConfigValue()
              const config = value?.discord
              const master_key = config?.master_key ?? []
              return {
                UserId: UserId,
                IsMaster: master_key.includes(UserId),
                IsBot: item == Bot.BotId,
                UserKey: useUserHashKey({
                  Platform: platform,
                  UserId: UserId
                })
              }
            })
            return MessageMention
          }
        }
      }
    }
  }
})
