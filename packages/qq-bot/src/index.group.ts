import {
  defineBot,
  getConfigValue,
  onProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  User,
  useUserHashKey
} from 'alemonjs'
import { AT_MESSAGE_CREATE_TYPE } from './message/AT_MESSAGE_CREATE'
import {
  AT_MESSAGE_CREATE,
  C2C_MESSAGE_CREATE,
  DIRECT_MESSAGE_CREATE,
  GROUP_AT_MESSAGE_CREATE,
  MESSAGE_CREATE
} from './send'
import { QQBotGroupClient } from './sdk/websoket.group'
import { isGuild } from './utils'
export const platform = 'qq-bot'
export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]

  // intents 需要默认值

  const client = new QQBotGroupClient({
    app_id: config?.app_id,
    intents: config?.intents ?? ['GROUP_AND_C2C_EVENT'],
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    secret: config?.secret,
    shard: config?.shard ?? [0, 1],
    token: config?.token,
    mode: config?.mode
  })

  // 连接
  client.connect()

  /**
   * group
   *
   * GROUP_AT_MESSAGE_CREATE
   * C2C_MESSAGE_CREATE
   */

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

  client.on('ERROR', console.error)

  // FRIEND_ADD
  global.client = client

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
      use: {
        send: async (event, val) => {
          if (val.length < 0) []
          // 打  tag
          const tag = event.tag
          try {
            if (tag == 'GROUP_AT_MESSAGE_CREATE') {
              return await GROUP_AT_MESSAGE_CREATE(client, event, val)
            }
            if (tag == 'C2C_MESSAGE_CREATE') {
              return await C2C_MESSAGE_CREATE(client, event, val)
            }
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
