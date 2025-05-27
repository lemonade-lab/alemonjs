import './env'
import {
  DataEnums,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  ResultCode,
  User,
  cbpPlatform,
  createResult,
  getConfigValue,
  useUserHashKey
} from 'alemonjs'
import { sendchannel, senduser } from './send'
import { DCClient } from './sdk/wss'
import { MESSAGE_CREATE_TYPE } from './sdk/message/MESSAGE_CREATE'
import { AvailableIntentsEventsEnum } from './sdk/types'
import { PrivateEventInteractionCreate, PublicEventInteractionCreate } from 'alemonjs'
export const platform = 'discord'

export default () => {
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

  /**
   * 连接 alemonjs 服务器。
   * 向 alemonjs 推送标准信息
   */
  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  // 连接
  client.connect(config?.gatewayURL)

  /**
   * 创建用户头像
   * @param UserId
   * @param avatar
   * @returns
   */
  const createUserAvatar = (UserId: string, avatar: string) => {
    return client.userAvatar(UserId, avatar)
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
      const e: PublicEventMessageCreate = {
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
        value: event
      }
      cbp.send(e)
    } else if (event.type == 0 && !event.member) {
      // 处理消息
      const e: PrivateEventMessageCreate = {
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
        value: event
      }
      cbp.send(e)
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
      const e: PrivateEventInteractionCreate = {
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
        value: event
      }
      cbp.send(e)
    } else {
      const e: PublicEventInteractionCreate = {
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
        value: event
      }
      cbp.send(e)
    }

    client.interactionsCallback(event.id, event.token, MessageText)
  })

  // 发送错误时
  client.on('ERROR', console.error)

  const api = {
    active: {
      send: {
        channel: async (channel_id, val: DataEnums[]) => {
          const res = await sendchannel(client, { channel_id }, val)
          return [createResult(ResultCode.Ok, '请求完成', res)]
        },
        user: async (author_id, val: DataEnums[]) => {
          const res = await senduser(client, { author_id: author_id }, val)
          return [createResult(ResultCode.Ok, '请求完成', res)]
        }
      }
    },
    use: {
      send: async (event, val: DataEnums[]) => {
        if (val.length < 0) {
          return Promise.all([])
        }
        const tag = event.tag
        if (tag == 'message.create') {
          const ChannelId = event.value.channel_id
          const res = await sendchannel(client, { channel_id: ChannelId }, val)
          return [createResult(ResultCode.Ok, '请求完成', res)]
        } else if (tag == 'private.message.create') {
          const UserId = event.value.author.id
          const ChannelId = event.value.channel_id
          const res = await senduser(
            client,
            {
              channel_id: ChannelId,
              author_id: UserId
            },
            val
          )
          return [createResult(ResultCode.Ok, '请求完成', res)]
        } else if (tag == 'interaction.create') {
          const ChannelId = event.value.channel_id
          const res = await sendchannel(client, { channel_id: ChannelId }, val)
          return [createResult(ResultCode.Ok, '请求完成', res)]
        } else if (tag == 'private.interaction.create') {
          const UserId = event.value.user.id
          const ChannelId = event.value.channel_id
          const res = await senduser(
            client,
            {
              channel_id: ChannelId,
              author_id: UserId
            },
            val
          )
          return [createResult(ResultCode.Ok, '请求完成', res)]
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
}
