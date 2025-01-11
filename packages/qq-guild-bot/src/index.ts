import {
  OnProcessor,
  defineBot,
  User,
  useUserHashKey,
  getConfigValue,
  PublicEventMessageCreate,
  PrivateEventMessageCreate
} from 'alemonjs'
import { QQBotGuildClient } from './sdk'
import { AT_MESSAGE_CREATE_TYPE } from './sdk/platform/qq/sdk/message/AT_MESSAGE_CREATE'
import { AT_MESSAGE_CREATE, DIRECT_MESSAGE_CREATE, MESSAGE_CREATE } from './send'
export type Client = typeof QQBotGuildClient.prototype
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
export const platform = 'qq-guild-bot'
export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  // 创建客户端
  const client = new QQBotGuildClient({
    appId: config.app_id,
    token: config.token
  })
  // 连接
  client.connect()

  client.on('DIRECT_MESSAGE_CREATE', async event => {
    // 屏蔽其他机器人的消息
    if (event?.author?.bot) return

    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)

    let msg = event?.content ?? ''

    const UserAvatar = {
      toBuffer: async () => {
        const arrayBuffer = await fetch(event.author.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        const arrayBuffer = await fetch(event?.author?.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        return event?.author?.avatar
      }
    }

    const UserId = event.author.id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      //
      // GuildId: event.guild_id,
      // ChannelId: event.channel_id,
      // 用户Id
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: event.author?.bot,
      // message
      MessageId: event.id,
      MessageText: msg,
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'DIRECT_MESSAGE_CREATE',
      //
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
  })

  // 监听消息
  client.on('AT_MESSAGE_CREATE', async event => {
    // 屏蔽其他机器人的消息
    if (event?.author?.bot) return

    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)

    let msg = getMessageContent(event)

    const UserAvatar = {
      toBuffer: async () => {
        const arrayBuffer = await fetch(event.author.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        const arrayBuffer = await fetch(event?.author?.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        return event?.author?.avatar
      }
    }

    const UserId = event.author.id

    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      IsMaster: isMaster,
      // 用户Id
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsBot: event.author?.bot,
      // message
      MessageId: event.id,
      MessageText: msg,
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'AT_MESSAGE_CREATE',
      //
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
  })

  /**
   *
   * @param event
   * @returns
   */
  const getMessageContent = event => {
    let msg = event?.content ?? ''
    // 艾特消息处理
    const at_users: {
      id: string
    }[] = []
    if (event.mentions) {
      // 去掉@ 转为纯消息
      for (const item of event.mentions) {
        at_users.push({
          id: item.id
        })
      }
      // 循环删除文本中的at信息并去除前后空格
      at_users.forEach(item => {
        msg = msg.replace(`<@!${item.id}>`, '').trim()
      })
    }
    return msg
  }

  // 私域 -
  client.on('MESSAGE_CREATE', async event => {
    // 屏蔽其他机器人的消息
    if (event.author?.bot) return

    // 撤回消息
    if (new RegExp(/DELETE$/).test(event.eventType)) return

    const master_key = config?.master_key ?? []

    const UserId = event.author.id

    const isMaster = master_key.includes(UserId)

    const msg = getMessageContent(event)

    const UserAvatar = {
      toBuffer: async () => {
        const arrayBuffer = await fetch(event.author.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        const arrayBuffer = await fetch(event?.author?.avatar).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        return event?.author?.avatar
      }
    }

    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      //
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
      UserId: event?.author?.id ?? '',
      UserKey,
      UserName: event?.author?.username ?? '',
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.id,
      MessageText: msg,
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGE_CREATE',
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
  })

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })

  global.client = client

  return {
    api: {
      use: {
        send: async (event, val) => {
          if (val.length < 0) []
          // 打  tag
          const tag = event.tag
          try {
            if (tag == 'DIRECT_MESSAGE_CREATE') {
              return await DIRECT_MESSAGE_CREATE(client, event, val)
            }
            if (tag == 'AT_MESSAGE_CREATE') {
              return await AT_MESSAGE_CREATE(client, event, val)
            }
            if (tag == 'MESSAGE_CREATE') {
              return await AT_MESSAGE_CREATE(client, event, val)
            }
            if (tag == 'MESSAGE_CREATE') {
              return await MESSAGE_CREATE(client, event, val)
            }
          } catch (error) {
            return [error]
          }
          return []
        },
        mention: async e => {
          const event = e.value
          const tag = e.tag
          // const event = e.value
          const Metions: User[] = []
          // group
          if (tag == 'GROUP_AT_MESSAGE_CREATE' || 'C2C_MESSAGE_CREATE') return Metions
          // guild
          if (event.mentions) {
            const mentions: AT_MESSAGE_CREATE_TYPE['mentions'] = e.value['mentions']
            // 艾特消息处理
            const MessageMention: User[] =
              mentions.map(item => {
                return {
                  UserId: item.id,
                  IsMaster: false,
                  UserName: item.username,
                  IsBot: item.bot,
                  UserKey: useUserHashKey({
                    Platform: 'qq-guild-bot',
                    UserId: item.id
                  })
                }
              }) ?? []
            return MessageMention
          } else {
            return Metions
          }
        }
      }
    }
  }
})
