import {
  defineBot,
  getConfigValue,
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  User,
  useUserHashKey
} from 'alemonjs'
import { QQBotClient } from './client'
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE'
export const client: typeof QQBotClient.prototype = new Proxy({} as typeof QQBotClient.prototype, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export const platform = 'qq-bot'
export default defineBot(() => {
  const value = getConfigValue()
  const config = value['qq-bot']
  const client = new QQBotClient({
    secret: config?.secret,
    app_id: config?.app_id,
    token: config?.token,
    port: config?.port,
    ws: config?.ws
  })

  // 连接
  client.connect()

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)

    const url = `https://q.qlogo.cn/qqapp/${config.app_id}/${event.author.id}/640`

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

    const UserId = event.author.id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      // 事件类型
      Platform: platform,
      // guild
      GuildId: event.group_id,
      ChannelId: event.group_id,
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // 格式化数据
      MessageId: event.id,
      MessageText: event.content?.trim(),
      OpenId: event.author.member_openid,
      CreateAt: Date.now(),
      tag: 'group',
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

  client.on('C2C_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const url = `https://q.qlogo.cn/qqapp/${config.app_id}/${event.author.id}/640`
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

    const UserId = event.author.id

    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // 格式化数据
      MessageId: event.id,
      MessageText: event.content?.trim(),
      CreateAt: Date.now(),
      OpenId: '',
      //
      tag: 'group',
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
    const e = {
      // 事件类型
      Platform: platform,
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
      tag: 'guild',
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
    const e = {
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
      tag: 'guild',
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
    const e = {
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
      tag: 'guild',
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

  client.on('ERROR', console.error)

  // FRIEND_ADD
  global.client = client

  return {
    api: {
      use: {
        send: (event, val) => {
          if (val.length < 0) return Promise.all([])
          // 打  tag
          const tag = event.tag
          if (tag == 'group') {
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
                    return ``
                  }
                  if (item.options?.belong == 'user') {
                    return `<@${item.value}>`
                  }
                  return ''
                  // return `<qqbot-at-everyone />`
                } else if (item.type == 'Text') {
                  return item.value
                }
              })
              .join('')
            if (content) {
              return Promise.all(
                [content].map(item =>
                  client.groupOpenMessages(event.GuildId, {
                    content: item,
                    msg_id: event.MessageId,
                    msg_type: 0,
                    msg_seq: client.getMessageSeq(event.MessageId)
                  })
                )
              )
            }
            const images = val.filter(item => item.type == 'Image').map(item => item.value)
            if (images) {
              return Promise.all(
                images.map(async msg => {
                  const file_info = await client
                    .postRichMediaByGroup(event.GuildId, {
                      file_type: 1,
                      file_data: msg.toString('base64')
                    })
                    .then(res => res?.file_info)
                  if (!file_info) return Promise.resolve(null)
                  return client.groupOpenMessages(event.GuildId, {
                    content: '',
                    media: {
                      file_info
                    },
                    msg_id: event.MessageId,
                    msg_type: 7,
                    msg_seq: client.getMessageSeq(event.MessageId)
                  })
                })
              )
            }
          } else {
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
          }

          return Promise.all([])
        },
        mention: async e => {
          const event = e.value
          const tag = e.tag
          // const event = e.value
          const Metions: User[] = []
          if (tag == 'group') {
            return Metions
          }
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
