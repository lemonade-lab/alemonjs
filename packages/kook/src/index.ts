import {
  defineBot,
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  getConfigValue,
  useUserHashKey,
  User
} from 'alemonjs'
import { KOOKClient } from './sdk/index'
export type Client = typeof KOOKClient.prototype
export const platform = 'kook'
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export default defineBot(() => {
  const value = getConfigValue()
  const config = value?.kook
  if (!config) return

  // 创建客户端
  const client = new KOOKClient({
    token: config.token
  })

  // 连接
  client.connect()

  client.on('MESSAGES_DIRECT', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) return false

    // 主人
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author_id)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    const url = avatar.substring(0, avatar.indexOf('?'))
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

    const UserId = event.author_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: '',
      CreateAt: Date.now(),
      //
      tag: 'MESSAGES_PUBLIC',
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
  client.on('MESSAGES_PUBLIC', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) return false

    // 创建私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data)

    // 主人
    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author_id)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    /**
     * 艾特类型所得到的
     * 包括机器人在内
     */
    const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
    for (const item of mention_role_part) {
      msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim()
    }

    /**
     * 艾特用户所得到的
     */
    const mention_part = event.extra.kmarkdown?.mention_part ?? []
    for (const item of mention_part) {
      msg = msg.replace(`(met)${item.id}(met)`, '').trim()
    }

    const url = avatar.substring(0, avatar.indexOf('?'))
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

    const UserId = event.author_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      // 事件类型
      Platform: platform,
      //
      GuildId: event.extra.guild_id,
      ChannelId: event.target_id,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: data?.code,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGES_PUBLIC',
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

  // 客户端全局化。
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
                  return `(met)all(met)`
                }
                if (item.options?.belong == 'user') {
                  return `(met)${item.value}(met)`
                } else if (item.options?.belong == 'channel') {
                  return `(chn)${item.value}(chn)`
                }
                return ''
              } else if (item.type == 'Text') {
                if (item.options?.style == 'block') {
                  return `\`${item.value}\``
                } else if (item.options?.style == 'italic') {
                  return `*${item.value}*`
                } else if (item.options?.style == 'bold') {
                  return `**${item.value}**`
                } else if (item.options?.style == 'strikethrough') {
                  return `~~${item.value}~~`
                } else if (item.options?.style == 'boldItalic') {
                  return `***${item.value}***`
                }
                return item.value
              }
            })
            .join('')
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.createMessage({
                  type: 9,
                  target_id: event.ChannelId,
                  content: item
                })
              )
            )
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(async item => {
                // 上传图片
                const res = await client.postImage(item)
                if (!res) return Promise.resolve()
                // 发送消息
                return await client.createMessage({
                  type: 2,
                  target_id: event.ChannelId,
                  content: res.data.url
                })
              })
            )
          }
          return Promise.all([])
        },
        mention: async e => {
          const event = e.value
          const MessageMention: User[] = []
          /**
           * 艾特类型所得到的,包括机器人在内
           */
          const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
          for (const item of mention_role_part) {
            MessageMention.push({
              UserId: item.role_id,
              UserName: item.name,
              UserKey: useUserHashKey({
                Platform: platform,
                UserId: item.role_id
              }),
              IsMaster: false,
              IsBot: true
            })
          }
          /**
           * 艾特用户所得到的
           */
          const mention_part = event.extra.kmarkdown?.mention_part ?? []
          for (const item of mention_part) {
            MessageMention.push({
              // avatar: item.avatar,
              UserId: item.id,
              UserName: item.username,
              UserKey: useUserHashKey({
                Platform: platform,
                UserId: item.role_id
              }),
              IsMaster: false,
              IsBot: false
            })
          }
          return MessageMention
        }
      }
    }
  }
})
