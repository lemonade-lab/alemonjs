import {
  OnProcessor,
  defineBot,
  getConfig,
  useUserHashKey,
  PrivateEventMessageCreate,
  PublicEventMessageCreate
} from 'alemonjs'
import { QQBotGroupClient } from './sdk'
export type Client = typeof QQBotGroupClient.prototype
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export const platform = 'qq-group-bot'
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.['qq-group-bot']
  if (!config) return

  // 创建客户端
  const client = new QQBotGroupClient({
    appId: config.app_id,
    secret: config.secret,
    token: config.token
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
      //
      tag: 'GROUP_AT_MESSAGE_CREATE',
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
      tag: 'GROUP_AT_MESSAGE_CREATE',
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

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })

  /**
   *
   * @param GuildId
   * @param msg
   * @returns
   */
  const getFileInfo = async (GuildId: string, msg: Buffer) => {
    let url = null
    return client
      .postRichMediaByGroup(GuildId, {
        file_type: 1,
        url,
        file_data: msg.toString('base64')
      })
      .then(res => res?.file_info)
  }

  // FRIEND_ADD

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
                const file_info = await getFileInfo(event.GuildId, msg)
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
          return Promise.all([])
        },
        mention: async () => {
          // const event = e.value
          return []
        }
      }
    }
  }
})
