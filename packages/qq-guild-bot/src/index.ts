import { OnProcessor, defineBot, getConfig, User, useUserHashKey } from 'alemonjs'
import { QQBotGuildClient } from './sdk'
import { AT_MESSAGE_CREATE_TYPE } from '../lib/sdk/platform/qq/sdk/message/AT_MESSAGE_CREATE'
export type Client = typeof QQBotGuildClient.prototype
export const client: Client = global.client
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.['qq-guild-bot']
  if (!config) return

  const Platform = 'qq-guild-bot'

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
      Platform: Platform,
      UserId: UserId
    })

    // 定义消
    const e = {
      // 事件类型
      Platform: Platform,
      //
      GuildId: event.guild_id,
      ChannelId: event.channel_id,
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
      Platform: Platform,
      UserId: UserId
    })

    // 定义消
    const e = {
      // 事件类型
      Platform: Platform,
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
      Platform: Platform,
      UserId: UserId
    })

    // 定义消
    const e = {
      // 事件类型
      Platform: Platform,
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
      tag: 'AT_MESSAGE_CREATE',
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
                  return `@everyone`
                }
                if (item.options?.belong == 'user') {
                  return `<@!${item.value}>`
                } else if (item.options?.belong == 'channel') {
                  return `<#${item.value}>`
                }
                return ''
              } else if (item.type == 'Text') {
                return item.value
              }
            })
            .join('')
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.channelsMessagesPost(event.ChannelId, {
                  content: item,
                  msg_id: event.MessageId
                })
              )
            )
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(item =>
                client.postImage(event.ChannelId, {
                  msg_id: event.MessageId,
                  image: item
                })
              )
            )
          }
          return Promise.all([])
        },
        mention: async e => {
          const event: AT_MESSAGE_CREATE_TYPE = e.value
          // 艾特消息处理
          const MessageMention: User[] =
            event?.mentions.map(item => {
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
        }
      }
    }
  }
})
