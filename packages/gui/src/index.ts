import {
  cbpPlatform,
  createResult,
  DataEnums,
  getConfigValue,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  ResultCode,
  User
} from 'alemonjs'
import { WebSocket, WebSocketServer } from 'ws'
import Koa from 'koa'
import KoaStatic from 'koa-static'
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
import { guiPath } from './file'
import * as filesPath from './file'
import koaRouter from 'koa-router'
// 跨域
import cors from '@koa/cors'
import { readFileSync } from 'node:fs'
import { getGUIConfig, getMaster, platform } from './config'

// 机器人信息
const Bot = {
  BotId: '794161769',
  BotName: '阿柠檬',
  BotAvatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=794161769'
}

// 数据处理
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

  // 跨域
  app.use(cors())

  // 暴露gui文件夹
  app.use(KoaStatic(guiPath))

  // body
  app.use(koaBody())

  // 路由
  const router = new koaRouter({
    prefix: '/api'
  })

  // 获取文件路径
  router.get('/files-path', async ctx => {
    const paths = {}
    for (const key in filesPath) {
      // 去掉当前路径
      if (typeof filesPath[key] === 'string') {
        // 要确保windows也能被切掉。
        if (process.platform === 'win32') {
          paths[key] = filesPath[key].replace(process.cwd().replace(/\\/g, '/'), '')
        } else {
          paths[key] = filesPath[key].replace(process.cwd(), '')
        }
      }
    }
    ctx.body = paths
  })

  // 获取配置
  router.get('/config', async ctx => {
    ctx.body = getConfigValue()
  })

  app.use(router.routes())
  app.use(router.allowedMethods())

  // 监听端口
  return app.listen(port, () => {
    console.log(`gui server start at port ${port}`)
  })
}

export * from './typing'

export { platform } from './config'

export const API = WebSocketServer

export default () => {
  // 获取配置
  const config = getGUIConfig()
  // 端口
  const port = process?.env?.port ?? 17117
  const serverPort = config.port || 17127
  // 创建服务器
  const server = createServer(serverPort)
  // 创建 WebSocketServer 并监听同一个端口
  const wss = new WebSocketServer({ server: server })
  // 客户端
  let client: WebSocket | null = null
  const url = `ws://127.0.0.1:${port}`
  const cbp = cbpPlatform(url)

  /**
   * 处理消息
   * @param event
   */
  const onMessage = (data: DataPublic) => {
    const event = data.d

    const [isMaster, UserKey] = getMaster(event.UserId)

    // 用户头像
    const UserAvatar = event.UserAvatar
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
      SpaceId: event.ChannelId,
      // 用户
      UserId: event.UserId,
      UserName: event.UserName,
      UserAvatar: UserAvatar,
      UserKey,
      // 属性
      IsMaster: isMaster,
      IsBot: event.IsBot,
      OpenId: event.OpenId,
      // 消息
      MessageId: String(event.MessageId),
      MessageText: msg,
      CreateAt: Date.now(),
      // 标记
      tag: 'send_message',
      value: data
    }
    cbp.send(e)
  }

  const onProvateMessage = (data: DataPrivate) => {
    const event = data.d

    const [isMaster, UserKey] = getMaster(event.UserId)

    const UserAvatar = event.UserAvatar

    // 纯文本
    const msg = event.MessageBody.map(item => {
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    }).join('')

    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event.UserId,
      UserName: event.UserName,
      UserAvatar,
      UserKey,
      IsMaster: isMaster,
      IsBot: event.IsBot,
      MessageId: String(event.MessageId),
      MessageText: msg,
      OpenId: event.OpenId,
      CreateAt: Date.now(),
      tag: 'send_private_message',
      value: data
    }
    cbp.send(e)
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
          // 处理消息
          const createAt = event.d.createAt
          const chats = getChats(createAt)
          ws.send(
            DATA.stringify({
              t: 'post_channel',
              d: chats
            })
          )
        } else if (event.t == 'get_private') {
          // 处理消息
          const createAt = event.d.createAt
          const chats = getPrivateChats(createAt)
          ws.send(
            DATA.stringify({
              t: 'post_private',
              d: chats
            })
          )
        } else if (event.t == 'del_channel') {
          // 删除消息
          delChat(event.d.createAt, event.d.MessageId)
        } else if (event.t == 'del_private') {
          // 删除消息
          delPrivateChat(event.d.createAt, event.d.MessageId)
        } else if (event.t == 'send_message') {
          // 发送消息
          addChat(event.d.createAt, event)
          onMessage(event)
        } else if (event.t == 'send_private_message') {
          // 发送消息
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
  })

  /**
   * 获取消息体
   * @param val
   * @returns
   */
  const getMessageBody = async (val: DataEnums[]) => {
    const MessageBody = await Promise.all(
      val.map(async item => {
        if (item.type == 'ImageFile') {
          const data = readFileSync(item.value)
          return {
            type: 'Image',
            value: data
          }
        } else if (item.type == 'ImageURL') {
          const arrayBuffer = await fetch(item.value).then(res => res.arrayBuffer())
          return {
            type: 'Image',
            value: Buffer.from(arrayBuffer)
          }
        }
        return item
      })
    )
    return MessageBody
  }

  const api = {
    // 主动的
    active: {
      // 发送消息
      send: {
        // 向频道发送消息
        channel: async (SpaceId: string, val: DataEnums[]) => {
          if (val.length < 0) return []
          const MessageBody = await getMessageBody(val)
          const db = {
            t: 'send_message' as DataPublic['t'],
            d: {
              MessageBody: MessageBody,
              MessageId: Date.now(),
              createAt: Date.now(),
              IsBot: true,
              OpenId: '',
              GuildId: '',
              ChannelId: SpaceId,
              SpaceId
            } as any
          }
          addChat(db.d.createAt, db)
          if (client) {
            client.send(DATA.stringify(db))
          }
          return []
        },
        // 向用户发送消息
        user: async (OpenId: string, val: DataEnums[]) => {
          if (val.length < 0) return []
          const MessageBody = await getMessageBody(val)
          const db = {
            t: 'send_private_message' as DataPrivate['t'],
            d: {
              MessageBody: MessageBody,
              MessageId: Date.now(),
              createAt: Date.now(),
              IsBot: true,
              OpenId: OpenId
            } as any
          }
          addPrivateChat(db.d.createAt, db)
          if (client) {
            client.send(DATA.stringify(db))
          }
          return []
        }
      }
    },
    // 被动的
    use: {
      // 发送消息
      send: async (event, val: DataEnums[]) => {
        if (val.length < 0) return Promise.all([])
        if (!client) return Promise.all([])
        const data: DataPrivate | DataPublic = event.value
        const MessageBody = await getMessageBody(val)
        if (data.t == 'send_message') {
          // 频道消息
          const db = {
            t: 'send_message' as DataPublic['t'],
            d: {
              MessageBody: MessageBody,
              MessageId: Date.now(),
              createAt: Date.now(),
              IsBot: true,
              OpenId: data.d.OpenId,
              GuildId: data.d.GuildId,
              ChannelId: data.d.ChannelId
            } as any
          }
          addChat(db.d.createAt, db)
          client.send(DATA.stringify(db))
          return []
        } else {
          // 私聊消息
          const db = {
            t: 'send_private_message' as DataPrivate['t'],
            d: {
              MessageBody: MessageBody,
              MessageId: Date.now(),
              createAt: Date.now(),
              IsBot: true,
              OpenId: data.d.OpenId
            } as any
          }
          addPrivateChat(db.d.createAt, db)
          client.send(DATA.stringify(db))
          return Promise.all([])
        }
      },
      mention: async e => {
        const event: DataPrivate | DataPublic = e.value
        if (event.t == 'send_private_message') {
          // 私聊消息
          const arr: User[] = []
          return arr
        } else {
          // 频道消息
          const mentions = event.d.MessageBody.filter(item => item.type == 'Mention')
            .filter(item => item.options?.belong == 'user')
            .map(item => item.value)
          const MessageMention: User[] = mentions.map(item => {
            const UserId = item
            const [isMaster, UserKey] = getMaster(UserId)
            return {
              UserId: UserId,
              IsMaster: isMaster,
              IsBot: item == Bot.BotId,
              UserKey: UserKey
            }
          })
          return MessageMention
        }
      }
    }
  }

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      const res = await api.use.send(event, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.channel') {
      const channel_id = data.payload.ChannelId
      const val = data.payload.params.format
      const res = await api.active.send.channel(channel_id, val)
      consume(res)
    } else if (data.action === 'message.send.user') {
      const user_id = data.payload.UserId
      const val = data.payload.params.format
      const res = await api.active.send.user(user_id, val)
      consume(res)
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      const res = await api.use.mention(event)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })

  cbp.onapis(async (data, consume) => {
    const key = data.payload?.key
    if (client[key]) {
      // 如果 client 上有对应的 key，直接调用。
      const params = data.payload.params
      const res = await client[key](...params)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })
}
