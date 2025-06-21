import {
  cbpPlatform,
  createResult,
  DataEnums,
  getConfigValue,
  PrivateEventInteractionCreate,
  PrivateEventMessageCreate,
  PublicEventInteractionCreate,
  PublicEventMessageCreate,
  ResultCode,
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
// import dayjs from 'dayjs'

export const platform = 'qq-bot'

export const getQQBotConfig = () => {
  let value = getConfigValue()
  if (!value) value = {}
  return value[platform] || {}
}

export const register = (client: QQBotClients) => {
  const config = getQQBotConfig()
  /**
   * 连接 alemonjs 服务器。
   * 向 alemonjs 推送标准信息
   */
  const port = process.env?.port || config?.port || 17117
  const url = `ws://127.0.0.1:${port}`
  const cbp = cbpPlatform(url)

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
    const UserAvatar = createUserAvatarURL(event.author.id)

    const UserId = event.author.id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      // guild
      GuildId: event.group_id,
      ChannelId: event.group_id,
      SpaceID: event.group_id,
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
      value: event
    }
    cbp.send(e)
  })

  client.on('C2C_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const UserAvatar = createUserAvatarURL(event.author.id)

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
      value: event
    }
    cbp.send(e)
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

    const UserAvatar = event?.author?.avatar

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
      value: event
    }
    cbp.send(e)
  })

  // 监听消息
  client.on('AT_MESSAGE_CREATE', async event => {
    // 屏蔽其他机器人的消息
    if (event?.author?.bot) return

    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)

    let msg = getMessageContent(event)

    const UserAvatar = event?.author?.avatar

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
      SpaceID: event.channel_id,
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
      value: event
    }
    cbp.send(e)
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
    const UserAvatar = event?.author?.avatar
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
      SpaceID: event.channel_id,
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
      value: event
    }
    cbp.send(e)
  })

  client.on('INTERACTION_CREATE', async event => {
    // try {
    //   if (event.scene === 'group' || event.scene === 'c2c') {
    //     await client.interactionResponse('group', event.id)
    //   }
    //   else if (event.scene === 'guild') {
    //     await client.interactionResponse('guild', event.id)
    //   }
    // } catch (err) {
    //   createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    // }

    if (event.scene === 'group') {
      const master_key = config?.master_key ?? []
      const isMaster = master_key.includes(event.group_member_openid)
      const UserAvatar = createUserAvatarURL(event.group_member_openid)

      const UserId = event.group_member_openid
      const UserKey = useUserHashKey({
        Platform: platform,
        UserId: UserId
      })

      const MessageText = event.data.resolved.button_data?.trim() || ''

      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        Platform: platform,
        // guild
        GuildId: event.group_openid,
        ChannelId: event.group_openid,
        SpaceID: event.group_openid,
        // 用户Id
        UserId: event.group_member_openid,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: `INTERACTION_CREATE:${event.id}`,
        MessageText: MessageText,
        OpenId: event.group_member_openid,
        tag: 'INTERACTION_CREATE_GROUP',
        CreateAt: Date.now(),
        value: event
      }

      cbp.send(e)
    } else if (event.scene === 'c2c') {
      const master_key = config?.master_key ?? []
      const isMaster = master_key.includes(event.user_openid)
      const UserAvatar = createUserAvatarURL(event.user_openid)

      const UserId = event.user_openid
      const UserKey = useUserHashKey({
        Platform: platform,
        UserId: UserId
      })

      const MessageText = event.data.resolved.button_data?.trim() || ''

      // 处理消息
      const e: PrivateEventInteractionCreate = {
        name: 'private.interaction.create',
        Platform: platform,
        // 用户Id
        UserId: event.user_openid,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: event.id,
        MessageText: MessageText,
        OpenId: event.user_openid,
        CreateAt: Date.now(),
        tag: 'INTERACTION_CREATE_C2C',
        value: event
      }
      cbp.send(e)
    } else if (event.scene === 'guild') {
      const master_key = config?.master_key ?? []
      const isMaster = master_key.includes(event.data.resolved.user_id)
      const UserAvatar = createUserAvatarURL(event.data.resolved.user_id)
      const UserId = event.data.resolved.user_id
      const UserKey = useUserHashKey({
        Platform: platform,
        UserId: UserId
      })
      const MessageText = event.data.resolved.button_data?.trim() || ''
      // 处理消息
      const e: PublicEventInteractionCreate = {
        name: 'interaction.create',
        Platform: platform,
        // guild
        GuildId: event.guild_id,
        ChannelId: event.channel_id,
        SpaceID: event.channel_id,
        // 用户Id
        UserId: event.data.resolved.user_id,
        UserKey,
        UserAvatar: UserAvatar,
        IsMaster: isMaster,
        IsBot: false,
        // 格式化数据
        MessageId: event.data.resolved.message_id,
        MessageText: MessageText,
        OpenId: event.guild_id,
        CreateAt: Date.now(),
        tag: 'INTERACTION_CREATE_GUILD',
        value: event
      }
      cbp.send(e)
    } else {
      logger.warn({
        code: ResultCode.Fail,
        message: '暂未更新支持此类型的交互事件',
        data: event
      })
    }
  })

  client.on('ERROR', console.error)

  const api = {
    active: {
      send: {
        channel: async (channel_id, val: DataEnums[]) => {
          if (!channel_id || typeof channel_id !== 'string') {
            throw new Error('Invalid channel_id: channel_id must be a string')
          }
          return await AT_MESSAGE_CREATE(
            client,
            {
              ChannelId: channel_id
            },
            val
          )
        },
        user: async (user_id, val: DataEnums[]) => {
          if (!user_id || typeof user_id !== 'string') {
            throw new Error('Invalid user_id: user_id must be a string')
          }
          return await C2C_MESSAGE_CREATE(
            client,
            {
              OpenId: user_id
            },
            val
          )
        }
      }
    },
    use: {
      send: async (event, val: DataEnums[]) => {
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
        // 交互
        if (tag == 'INTERACTION_CREATE_GROUP') {
          return await GROUP_AT_MESSAGE_CREATE(client, event, val)
        }
        if (tag == 'INTERACTION_CREATE_C2C') {
          return await C2C_MESSAGE_CREATE(client, event, val)
        }
        if (tag == 'INTERACTION_CREATE_GUILD') {
          return await AT_MESSAGE_CREATE(client, event, val)
        }
        return Promise.all([])
      },
      mention: async event => {
        const value = event.value || {}
        const tag = event.tag
        // const event = e.value
        const Metions: User[] = []
        // group
        if (tag == 'GROUP_AT_MESSAGE_CREATE' || 'C2C_MESSAGE_CREATE') return Metions
        // guild
        if (value.mentions) {
          const mentions: AT_MESSAGE_CREATE_TYPE['mentions'] = event.value['mentions']
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

  // 处理行为
  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      // 消息发送
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      // 消费
      const res = await api.use.send(event, paramFormat)
      consume(res)
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      // 获取提及
      const metions = await api.use.mention(event)
      // 消费
      consume([createResult(ResultCode.Ok, '请求完成', metions)])
    } else if (data.action === 'message.send.channel') {
      // 主动发送消息到频道
      const channel_id = data.payload.ChannelId
      const paramFormat = data.payload.params.format
      const res = await api.active.send.channel(channel_id, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.user') {
      // 主动发送消息到用户
      const user_id = data.payload.UserId
      const paramFormat = data.payload.params.format
      const res = await api.active.send.user(user_id, paramFormat)
      consume(res)
    }
  })

  // 处理 api 调用
  cbp?.onapis &&
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
