import {
  ClientAPI,
  getConfigValue,
  onProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  useUserHashKey
} from 'alemonjs'
import { QQBotClients } from './sdk/client.websoket'
import { User } from 'alemonjs'
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE'
import {
  AT_MESSAGE_CREATE,
  C2C_MESSAGE_CREATE,
  DIRECT_MESSAGE_CREATE,
  GROUP_AT_MESSAGE_CREATE,
  MESSAGE_CREATE
} from './sends'
import { isGuild } from './utils'
export const platform = 'qq-bot'
export const register = (client: QQBotClients) => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  /**
   * group
   *
   * GROUP_AT_MESSAGE_CREATE
   * C2C_MESSAGE_CREATE
   */

  const createUserAvatarURL = (author_id: string) => {
    return `https://q.qlogo.cn/qqapp/${config.app_id}/${author_id}/640`
  }

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const url = createUserAvatarURL(event.author.id)
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
      name: 'message.create',
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
      tag: 'GROUP_AT_MESSAGE_CREATE',
      value: null
    }
    // 处理消息
    onProcessor('message.create', e, event)
  })

  client.on('C2C_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const url = createUserAvatarURL(event.author.id)
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
      name: 'private.message.create',
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
      OpenId: event.author.user_openid,
      //
      tag: 'C2C_MESSAGE_CREATE',
      value: null
    }
    // 处理消息
    onProcessor('private.message.create', e, event)
  })

  /**
   * guild
   */

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
      MessageText: msg?.trim(),
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'DIRECT_MESSAGE_CREATE',
      //
      value: null
    }

    // 处理消息
    onProcessor('private.message.create', e, event)
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
      MessageText: msg?.trim(),
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'AT_MESSAGE_CREATE',
      //
      value: null
    }

    // 处理消息
    onProcessor('message.create', e, event)
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
      MessageText: msg?.trim(),
      OpenId: event.guild_id,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGE_CREATE',
      value: null
    }
    // 处理消息
    onProcessor('message.create', e, event)
  })

  client.on('ERROR', console.error)
}

export const createClientAPI = (client: QQBotClients): ClientAPI => {
  return {
    platform,
    api: {
      // 主动消息
      active: {
        send: {
          channel: async (channel_id: string, data) => {
            if (isGuild(channel_id)) {
              return await AT_MESSAGE_CREATE(
                client,
                {
                  ChannelId: channel_id
                },
                data
              )
            } else {
              // 需要message_id 。如果没有，则是主动消息，在group中，只能发送4条。
              return await GROUP_AT_MESSAGE_CREATE(
                client,
                {
                  GuildId: channel_id
                },
                data
              )
            }
          },
          user: async (user_id: string, data: any) => {
            if (isGuild(user_id)) {
              return await DIRECT_MESSAGE_CREATE(
                client,
                {
                  OpenId: user_id
                },
                data
              )
            } else {
              return await C2C_MESSAGE_CREATE(
                client,
                {
                  OpenId: user_id
                },
                data
              )
            }
          }
        }
      },
      // 被动消息
      use: {
        send: async (event, val) => {
          if (val.length < 0) Promise.all([])
          // 打  tag
          const tag = event.tag
          // 群at
          if (tag == 'GROUP_AT_MESSAGE_CREATE') {
            return await GROUP_AT_MESSAGE_CREATE(client, event, val)
          }
          // 私聊
          if (tag == 'C2C_MESSAGE_CREATE') {
            return await C2C_MESSAGE_CREATE(client, event, val)
          }
          // 频道私聊
          if (tag == 'DIRECT_MESSAGE_CREATE') {
            return await DIRECT_MESSAGE_CREATE(client, event, val)
          }
          // 频道at
          if (tag == 'AT_MESSAGE_CREATE') {
            return await AT_MESSAGE_CREATE(client, event, val)
          }
          // 频道消息
          if (tag == 'MESSAGE_CREATE') {
            return await MESSAGE_CREATE(client, event, val)
          }
          return Promise.all([])
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
}
