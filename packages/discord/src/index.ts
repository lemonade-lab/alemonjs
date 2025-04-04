import './env'
import { User, definePlatform, getConfigValue, onProcessor, useUserHashKey } from 'alemonjs'
import { sendchannel, senduser } from './send'
import { DCClient } from './sdk/wss'
import { MESSAGE_CREATE_TYPE } from './sdk/message/MESSAGE_CREATE'
import { AvailableIntentsEventsEnum } from './sdk/types'
export type Client = typeof DCClient.prototype
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
export const platform = 'discord'
export default definePlatform(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]

  // 创建客户端
  const client = new DCClient({
    gatewayURL: config?.gatewayURL,
    token: config.token,
    shard: config?.shard ?? [0, 1],
    intent: config?.intent ?? AvailableIntentsEventsEnum
  })

  // 连接
  client.connect(config?.gatewayURL)

  const ImageURLToBuffer = async (url: string) => {
    const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
    return Buffer.from(arrayBuffer)
  }

  /**
   * 创建用户头像
   * @param UserId
   * @param avatar
   * @returns
   */
  const createUserAvatar = (UserId: string, avatar: string) => {
    let url = null
    return {
      toBuffer: async () => {
        if (!url) {
          url = client.userAvatar(UserId, avatar)
        }
        return ImageURLToBuffer(url)
      },
      toBase64: async () => {
        if (!url) {
          url = client.userAvatar(UserId, avatar)
        }
        const buffer = await ImageURLToBuffer(url)
        return buffer?.toString('base64')
      },
      toURL: async () => {
        if (!url) {
          url = client.userAvatar(UserId, avatar)
        }
        return url
      }
    }
  }

  // 监听消息
  client.on('MESSAGE_CREATE', async event => {
    // 消除bot消息
    if (event.author?.bot) return

    // 艾特消息处理
    const at_users: {
      id: string
    }[] = []

    // 获取艾特用户
    for (const item of event.mentions) {
      at_users.push({
        id: item.id
      })
    }

    // 清除 @ 相关的消息
    let msg = event.content
    for await (const item of at_users) {
      msg = msg.replace(`<@${item.id}>`, '').trim()
    }

    const UserId = event.author.id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(UserKey)

    const UserAvatar = createUserAvatar(UserId, event.author.avatar)

    if (event.type == 0 && event.member) {
      // 处理消息
      onProcessor(
        'message.create',
        {
          name: 'message.create',
          // 事件类型
          Platform: platform,
          // guild
          GuildId: event.guild_id,
          ChannelId: event.channel_id,
          // user
          UserId: UserId,
          UserKey,
          UserName: event.author.username,
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: false,
          // message
          MessageId: event.id,
          MessageText: msg,
          OpenId: '',
          CreateAt: Date.now(),
          // other
          tag: 'message.create',
          value: null
        },
        event
      )
    } else if (event.type == 0 && !event.member) {
      // 处理消息
      onProcessor(
        'private.message.create',
        {
          name: 'private.message.create',
          // 事件类型
          Platform: platform,
          // guild
          // GuildId: event.guild_id,
          // ChannelId: event.channel_id,
          // user
          UserId: UserId,
          UserKey,
          UserName: event.author.username,
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: false,
          // message
          MessageId: event.id,
          MessageText: msg,
          OpenId: '',
          CreateAt: Date.now(),
          // other
          tag: 'private.message.create',
          value: null
        },
        event
      )
    } else {
      // 未知类型
    }
  })

  client.on('INTERACTION_CREATE', event => {
    console.log('event', event)

    const isPrivate = typeof event['user'] === 'object' ? true : false
    const user = isPrivate ? event['user'] : event['member'].user

    const UserId = user.id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })
    const UserAvatar = createUserAvatar(UserId, user.avatar)
    const UserName = user.username
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(UserKey)
    const MessageText = event.data.custom_id
    if (isPrivate) {
      // 处理消息
      onProcessor(
        'private.interaction.create',
        {
          name: 'private.interaction.create',
          // 事件类型
          Platform: platform,
          // guild
          // GuildId: event['guild_id'],
          // ChannelId: event.channel_id,
          // user
          UserId: UserId,
          UserKey,
          UserName: UserName,
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: false,
          // message
          MessageId: event.id,
          MessageText: MessageText,
          OpenId: '',
          CreateAt: Date.now(),
          // other
          tag: 'private.interaction.create',
          value: null
        },
        event
      )
    } else {
      // 处理消息
      onProcessor(
        'interaction.create',
        {
          name: 'interaction.create',
          // 事件类型
          Platform: platform,
          // guild
          GuildId: event['guild_id'],
          ChannelId: event.channel_id,
          // user
          UserId: UserId,
          UserKey,
          UserName: UserName,
          UserAvatar: UserAvatar,
          IsMaster: isMaster,
          IsBot: false,
          // message
          MessageId: event.id,
          MessageText: MessageText,
          OpenId: '',
          CreateAt: Date.now(),
          // other
          tag: 'interaction.create',
          value: null
        },
        event
      )
    }

    client.interactionsCallback(event.id, event.token, MessageText)
  })

  // 发送错误时
  client.on('ERROR', console.error)

  global.client = client

  return {
    platform,
    api: {
      active: {
        send: {
          channel: (channel_id, val) => {
            return sendchannel(client, { channel_id }, val)
          },
          user: async (author_id, val) => {
            return senduser(client, { author_id: author_id }, val)
          }
        }
      },
      use: {
        send: async (event, val) => {
          if (val.length < 0) {
            return Promise.all([])
          }
          const tag = event.tag
          if (tag == 'message.create') {
            const ChannelId = event.value.channel_id
            return sendchannel(client, { channel_id: ChannelId }, val)
          } else if (tag == 'private.message.create') {
            const UserId = event.value.author.id
            const ChannelId = event.value.channel_id
            return senduser(
              client,
              {
                channel_id: ChannelId,
                author_id: UserId
              },
              val
            )
          } else if (tag == 'interaction.create') {
            const ChannelId = event.value.channel_id
            return sendchannel(client, { channel_id: ChannelId }, val)
          } else if (tag == 'private.interaction.create') {
            const UserId = event.value.user.id
            const ChannelId = event.value.channel_id
            return senduser(
              client,
              {
                channel_id: ChannelId,
                author_id: UserId
              },
              val
            )
          }
          return Promise.all([])
        },
        mention: async e => {
          const event: MESSAGE_CREATE_TYPE = e.value
          const MessageMention: User[] = event.mentions.map(item => {
            const UserId = item.id
            const avatar = event.author.avatar
            const value = getConfigValue()
            const config = value?.discord
            const master_key = config?.master_key ?? []
            const UserAvatar = createUserAvatar(UserId, avatar)
            const UserKey = useUserHashKey({
              Platform: platform,
              UserId: UserId
            })
            return {
              UserId: item.id,
              IsMaster: master_key.includes(UserId),
              IsBot: item.bot,
              UserAvatar,
              UserKey
            }
          })
          return MessageMention
        }
      }
    }
  }
})
