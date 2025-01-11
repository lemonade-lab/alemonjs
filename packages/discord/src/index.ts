import { OnProcessor, User, defineBot, getConfigValue, useUserHashKey } from 'alemonjs'
import { DCClient } from './sdk/index'
import { MESSAGE_CREATE_TYPE } from './sdk/platform/discord/sdk/message/MESSAGE_CREATE'
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
export default defineBot(() => {
  const value = getConfigValue()
  const config = value[platform]

  // 创建客户端
  const client = new DCClient({
    token: config.token
  })

  // 连接
  client.connect()

  // 监听消息
  client.on('MESSAGE_CREATE', async event => {
    // 消除bot消息
    if (event.author?.bot) return

    const master_key = config?.master_key ?? []
    const isMaster = master_key.includes(event.author.id)

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

    let url: null | string = null

    const UserAvatar = {
      toBuffer: async () => {
        if (!url) {
          url = client.userAvatar(UserId, event.author.avatar)
        }
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        if (!url) {
          url = client.userAvatar(UserId, event.author.avatar)
        }
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        if (!url) {
          url = client.userAvatar(UserId, event.author.avatar)
        }
        return url
      }
    }

    // 定义消
    const e = {
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
      tag: 'MESSAGE_CREATE',
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
  client.on('ERROR', console.error)

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
                  return `<@everyone>`
                }
                if (item.options?.belong == 'user') {
                  return `<@${item.value}>`
                } else if (item.options?.belong == 'channel') {
                  return `<#${item.value}>`
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
                }
                return item.value
              }
            })
            .join('')
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.channelsMessages(event.ChannelId, {
                  content: item
                })
              )
            )
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(item => client.channelsMessagesImage(event.ChannelId, item))
            )
          }
          return Promise.all([])
        },
        mention: async e => {
          const event: MESSAGE_CREATE_TYPE = e.value
          const MessageMention: User[] = event.mentions.map(item => {
            let url = null
            const UserId = item.id
            const avatar = event.author.avatar
            const value = getConfigValue()
            const config = value?.discord
            const master_key = config?.master_key ?? []
            const UserAvatar = {
              toBuffer: async () => {
                if (!url) {
                  url = client.userAvatar(UserId, avatar)
                }
                const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
                return Buffer.from(arrayBuffer)
              },
              toBase64: async () => {
                if (!url) {
                  url = client.userAvatar(UserId, avatar)
                }
                const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
                return Buffer.from(arrayBuffer).toString('base64')
              },
              toURL: async () => {
                if (!url) {
                  url = client.userAvatar(UserId, avatar)
                }
                return url
              }
            }
            return {
              UserId: item.id,
              IsMaster: master_key.includes(UserId),
              IsBot: item.bot,
              UserAvatar,
              UserKey: useUserHashKey({
                Platform: platform,
                UserId: UserId
              })
            }
          })
          return MessageMention
        }
      }
    }
  }
})
