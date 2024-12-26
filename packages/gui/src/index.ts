import {
  defineBot,
  getConfig,
  getConfigValue,
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  User,
  useUserHashKey
} from 'alemonjs'
import { WebSocketServer } from 'ws'
import Koa from 'koa'
import KoaStatic from 'koa-static'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import router from './api'
import koaBody from 'koa-bodyparser'

type Message = {
  UserId: string
  UserName: string
  UserAvatar: string
  MessageId: string
  MessageText: string
  OpenId: string
  IsMaster: number
  IsBot: number
  GuildId: string
  ChannelId: string
}

type PrivateMessage = {
  UserId: string
  UserName: string
  UserAvatar: string
  MessageId: string
  MessageText: string
  OpenId: string
  IsMaster: number
  IsBot: number
}

type Text = {
  t: 'Text'
  d: string
}

type Image = {
  t: 'Image'
  d: {
    url_data?: string
    url_index?: string
  }
}

const DATA = {
  stringify: (message: { t: 'send_message' | 'send_private_message'; d: (Text | Image)[] }) =>
    JSON.stringify(message),
  parse: (message: string) =>
    JSON.parse(message) as {
      t: 'send_message' | 'send_private_message'
      d: Message | PrivateMessage
    }
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

  // 使用路由
  app.use(router.routes())
  app.use(router.allowedMethods())

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
      return global.client[prop]
    }
    return undefined
  }
})

export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.gui
  if (!config) return
  const port = config?.port ?? 9601
  //
  const server = createServer(port)

  // 创建 WebSocketServer 并监听同一个端口
  const wss = new WebSocketServer({ server: server })

  //
  let client = null
  //
  const onMessage = (event: Message) => {
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

    /**
     * Removes all mentions in the format <@xxx> or <#xxx> from the input string.
     */
    const removeMentions = (va: string): string => {
      const regex = /<[@#]\w+>/g
      return va.replace(regex, '').trim()
    }

    const msg = removeMentions(event.MessageText)

    const e: PublicEventMessageCreate = {
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
      IsMaster: event.IsMaster == 0 ? false : true,
      IsBot: event.IsBot == 0 ? false : true,
      //
      MessageId: event.MessageId,
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
        return event
      }
    })
    // 处理消息
    OnProcessor(e, 'message.create')
  }

  const onProvateMessage = (event: PrivateMessage) => {
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

    const e: PrivateEventMessageCreate = {
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event.UserId,
      UserName: event.UserName,
      UserAvatar,
      UserKey,
      IsMaster: event.IsMaster == 0 ? false : true,
      IsBot: event.IsBot == 0 ? false : true,
      // 消息
      MessageId: event.MessageId,
      MessageText: event.MessageText,
      OpenId: event.OpenId,
      CreateAt: Date.now(),
      //
      tag: 'send_private_message',
      value: null
    }
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return event
      }
    })
    // 处理消息
    OnProcessor(e, 'private.message.create')
  }

  /**
   *
   */
  wss.on('connection', ws => {
    console.log('gui connection')
    //
    client = ws
    // 处理消息事件
    ws.on('message', (message: string) => {
      try {
        const event = DATA.parse(message)
        if (event.t == 'send_message') {
          onMessage(event.d as any)
        } else if (event.t == 'send_private_message') {
          onProvateMessage(event.d as any)
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

  //
  return {
    api: {
      use: {
        send: (event, val) => {
          if (val.length < 0) return Promise.all([])
          const content = val
            .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
            .map(item => {
              if (item.type == 'Link') {
                return `[${item.options?.title ?? item.value}](${item.value})`
              } else if (item.type == 'Mention') {
                if (
                  item.value == 'everyone' ||
                  item.value == 'all' ||
                  item.value == '' ||
                  typeof item.value != 'string'
                ) {
                  return `<@everyone>`
                }
                if (item.options?.belong == 'user') {
                  return `<@${item.value}>`
                } else if (item.options?.belong == 'channel') {
                  return `<#${item.value}>`
                }
                return ''
              } else if (item.type == 'Text') {
                if (item.options?.style == 'block') {
                  return `\`${item.value}\``
                } else if (item.options?.style == 'italic') {
                  return `*${item.value}*`
                } else if (item.options?.style == 'bold') {
                  return `**${item.value}**`
                } else if (item.options?.style == 'strikethrough') {
                  return `~~${item.value}~~`
                }
                return item.value
              }
            })
            .join('')
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.send(
                  DATA.stringify({
                    t: event.tag,
                    d: [
                      {
                        t: 'Text',
                        d: item
                      }
                    ]
                  })
                )
              )
            )
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(async item => {
                const url = `/file/${Date.now()}.png`
                writeFileSync(join(process.cwd(), 'public', url), item, 'utf-8')
                return client.send(
                  DATA.stringify({
                    t: event.tag,
                    d: [
                      {
                        t: 'Image',
                        d: {
                          // url_data: base64,
                          url_index: url
                        }
                      }
                    ]
                  })
                )
              })
            )
          }
          return Promise.all([])
        },
        mention: async e => {
          const event = e.value
          const getMentions = (va: string): string[] => {
            const regex = /<[@]\w+>/g
            const matches = va.match(regex)
            return matches || []
          }
          const mentions = getMentions(event.MessageText).filter(item => item != '<@everyone>')
          const MessageMention: User[] = mentions.map(item => {
            const UserId = item.slice(2, item.length - 1)
            const value = getConfigValue()
            const config = value?.discord
            const master_key = config?.master_key ?? []
            return {
              UserId: UserId,
              IsMaster: master_key.includes(UserId),
              IsBot: false,
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
})
