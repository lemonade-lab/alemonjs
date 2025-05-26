import {
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  getConfigValue,
  useUserHashKey,
  User,
  DataEnums,
  cbpPlatform
} from 'alemonjs'
import { KOOKClient } from './sdk/index'
import { readFileSync } from 'fs'
export const platform = 'kook'

export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]

  // 创建客户端
  const client = new KOOKClient({
    token: config.token
  })

  // 连接
  client.connect()

  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  client.on('MESSAGES_DIRECT', async event => {
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

    const url = avatar.substring(0, avatar.indexOf('?'))
    const UserAvatar = url

    const UserId = event.author_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
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
      OpenId: data?.code,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGES_PUBLIC',
      value: event
    }
    cbp.send(e)
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
    const UserAvatar = url

    const UserId = event.author_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
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
      value: event
    }
    cbp.send(e)
  })

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendChannel = (channel_id: string, val: DataEnums[]) => {
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
            target_id: channel_id,
            content: item
          })
        )
      )
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images) {
      return Promise.all(
        images.map(async item => {
          if (item.type == 'ImageURL') {
            return await client.createMessage({
              type: 2,
              target_id: channel_id,
              content: item.value
            })
          }
          let data = item.value
          if (item.type == 'ImageFile') {
            data = readFileSync(item.value)
          }
          // 上传图片
          const res = await client.postImage(data)
          if (!res) return Promise.resolve()
          // 发送消息
          return await client.createMessage({
            type: 2,
            target_id: channel_id,
            content: res.data.url
          })
        })
      )
    }
    return Promise.all([])
  }

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendUser = async (user_id: string, val: DataEnums[]) => {
    if (val.length < 0) return Promise.all([])
    // 创建私聊标记
    const data = await client.userChatCreate(user_id).then(res => res?.data)
    const open_id = data?.code
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
          client.createDirectMessage({
            type: 9,
            chat_code: open_id,
            content: item
          })
        )
      )
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images) {
      return Promise.all(
        images.map(async item => {
          if (item.type == 'ImageURL') {
            return await client.createDirectMessage({
              type: 2,
              chat_code: open_id,
              content: item.value
            })
          }
          let data = item.value
          if (item.type == 'ImageFile') {
            data = readFileSync(item.value)
          }
          // 上传图片
          const res = await client.postImage(data)
          if (!res) return Promise.resolve()
          // 发送消息
          return await client.createDirectMessage({
            type: 2,
            chat_code: open_id,
            content: res.data.url
          })
        })
      )
    }
    return Promise.all([])
  }

  const api = {
    active: {
      send: {
        channel: sendChannel,
        user: sendUser
      }
    },
    use: {
      send: (event, val) => {
        if (val.length < 0) return Promise.all([])
        if (event.name == 'message.create') {
          return sendChannel(event.ChannelId, val)
        } else if (event.name == 'private.message.create') {
          return sendUser(event.UserId, val)
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
      consume(res)
    }
  })
}
