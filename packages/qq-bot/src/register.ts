import {
  cbpPlatform,
  getConfigValue,
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
export const platform = 'qq-bot'

export const getQQBotConfig = () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  return config || {}
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

  const createUserAvatar = (url: string) => {
    return {
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
  }

  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const url = createUserAvatarURL(event.author.id)
    const UserAvatar = createUserAvatar(url)

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
      value: event
    }
    cbp.send(e)
  })

  client.on('C2C_MESSAGE_CREATE', async event => {
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)
    const url = createUserAvatarURL(event.author.id)
    const UserAvatar = createUserAvatar(url)

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

    const UserAvatar = createUserAvatar(event?.author?.avatar)

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

    const UserAvatar = createUserAvatar(event?.author?.avatar)

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
    const UserAvatar = createUserAvatar(event?.author?.avatar)
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
      value: event
    }
    cbp.send(e)
  })

  client.on('ERROR', console.error)

  const sendMesage = async (event, val) => {
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
  }

  const getMesion = async event => {
    const value = event.value
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

  const sendMessageChannel = async (channel_id: string, data) => {
    if (!channel_id || typeof channel_id !== 'string') {
      throw new Error('Invalid channel_id: channel_id must be a string')
    }
    return await AT_MESSAGE_CREATE(
      client,
      {
        ChannelId: channel_id
      },
      data
    )
  }

  const sendMessageUser = async (user_id: string, data: any) => {
    if (!user_id || typeof user_id !== 'string') {
      throw new Error('Invalid user_id: user_id must be a string')
    }
    return await C2C_MESSAGE_CREATE(
      client,
      {
        OpenId: user_id
      },
      data
    )
  }

  // 处理行为
  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      // 消息发送
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      // 消费
      const res = await sendMesage(event, paramFormat)
      consume(res)
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      // 获取提及
      const metions = await getMesion(event)
      // 消费
      consume(metions)
    } else if (data.action === 'message.send.channel') {
      // 主动发送消息到频道
      const channel_id = data.payload.ChannelId
      const paramFormat = data.payload.params.format
      const res = await sendMessageChannel(channel_id, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.user') {
      // 主动发送消息到用户
      const user_id = data.payload.UserId
      const paramFormat = data.payload.params.format
      const res = await sendMessageUser(user_id, paramFormat)
      consume(res)
    }
  })
}
