import {
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  User,
  defineBot,
  getConfigValue,
  onProcessor,
  useUserHashKey
} from 'alemonjs'
import { DCClient } from './sdk/index'
import { MESSAGE_CREATE_TYPE } from './sdk/platform/discord/sdk/message/MESSAGE_CREATE'
import { readFileSync } from 'fs'
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
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]

  // 创建客户端
  const client = new DCClient({
    token: config.token
  })

  // 连接
  client.connect()

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

    console.log('event', event)

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

    const UserAvatar = createUserAvatar(UserId, event.author.avatar)

    if (event.type == 0) {
      // 私聊
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
        value: null
      }
      // 处理消息
      onProcessor('private.message.create', e, event)
    } else if (event.type == 8) {
      // 群聊
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
        value: null
      }
      // 处理消息
      onProcessor('message.create', e, event)
    } else {
      // 未知类型
    }
  })

  // client.on('')

  // 发送错误时
  client.on('ERROR', console.error)

  global.client = client

  return {
    platform,
    api: {
      active: {
        send: {
          channel: (channel_id, val) => {
            if (val.length < 0) return Promise.all([])
            const content = val
              .filter(item => item.type == 'Mention' || item.type == 'Text')
              .map(item => {
                // if (item.type == 'Link') {
                //   return `[${item.options?.title ?? item.value}](${item.value})`
                // } else
                if (item.type == 'Mention') {
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
                  client.channelsMessages(channel_id, {
                    content: item
                  })
                )
              )
            }
            const images = val.filter(
              item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
            )
            if (images.length > 0) {
              return Promise.all(
                images.map(async item => {
                  if (item.type == 'Image') {
                    return client.channelsMessagesImage(channel_id, item.value)
                  } else if (item.type == 'ImageURL') {
                    return client.channelsMessagesImage(channel_id, ImageURLToBuffer(item.value))
                  } else if (item.type == 'ImageFile') {
                    const data = readFileSync(item.value)
                    return client.channelsMessagesImage(channel_id, data)
                  }
                })
              )
            }
            return Promise.all([])
          },
          user: async (author_id, val) => {
            if (val.length < 0) return Promise.all([])
            const res = await client.userMeChannels(author_id)
            const channel_id = res.id
            const content = val
              .filter(item => item.type == 'Mention' || item.type == 'Text')
              .map(item => {
                // if (item.type == 'Link') {
                //   return `[${item.options?.title ?? item.value}](${item.value})`
                // } else
                if (item.type == 'Mention') {
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
                  client.channelsMessages(channel_id, {
                    content: item
                  })
                )
              )
            }
            const images = val.filter(
              item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
            )
            if (images.length > 0) {
              return Promise.all(
                images.map(async item => {
                  if (item.type == 'Image') {
                    return client.channelsMessagesImage(channel_id, item.value)
                  } else if (item.type == 'ImageURL') {
                    return client.channelsMessagesImage(channel_id, ImageURLToBuffer(item.value))
                  } else if (item.type == 'ImageFile') {
                    const data = readFileSync(item.value)
                    return client.channelsMessagesImage(channel_id, data)
                  }
                })
              )
            }
            return Promise.all([])
          }
        }
      },
      use: {
        send: async (event, val) => {
          if (val.length < 0) return Promise.all([])
          let channel_id = event.ChannelId
          if (/private/.test(event.name)) {
            const data = event.value
            channel_id = data?.channel_id
            if (!channel_id) return Promise.all([])
          }
          const content = val
            .filter(item => item.type == 'Mention' || item.type == 'Text')
            .map(item => {
              // if (item.type == 'Link') {
              //   return `[${item.options?.title ?? item.value}](${item.value})`
              // } else
              if (item.type == 'Mention') {
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
                client.channelsMessages(channel_id, {
                  content: item
                })
              )
            )
          }
          const images = val.filter(
            item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
          )
          if (images.length > 0) {
            return Promise.all(
              images.map(async item => {
                if (item.type == 'Image') {
                  return client.channelsMessagesImage(channel_id, item.value)
                } else if (item.type == 'ImageURL') {
                  return client.channelsMessagesImage(channel_id, ImageURLToBuffer(item.value))
                } else if (item.type == 'ImageFile') {
                  const data = readFileSync(item.value)
                  return client.channelsMessagesImage(channel_id, data)
                }
              })
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
