import { defineBot, Text, OnProcessor, useParse, At, getConfig, createHash } from 'alemonjs'
import { KOOKClient } from './sdk/index'
export type Client = typeof KOOKClient.prototype
export const client: Client = global.client
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.kook
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
    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author_id)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    // 艾特消息处理
    const at_users: {
      id: string
      name: string
      avatar: string
      bot: boolean
    }[] = []

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

    const UserKey = createHash(`kook:${event.author_id}`)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 用户Id
      UserId: event.author_id,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      // message
      MessageId: event.msg_id,
      MessageBody: [
        Text(msg),
        ...at_users.map(item =>
          At(item.id, 'user', { name: item.name, avatar: item.avatar, bot: item.bot })
        )
      ],
      MessageText: msg,
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
    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author_id)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    // 艾特消息处理
    const at_users: {
      id: string
      name: string
      avatar: string
      bot: boolean
    }[] = []

    /**
     * 艾特类型所得到的
     * 包括机器人在内
     */
    const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
    for (const item of mention_role_part) {
      at_users.push({
        id: item.role_id,
        name: item.name,
        avatar: '',
        bot: true
      })
      msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim()
    }

    /**
     * 艾特用户所得到的
     */
    const mention_part = event.extra.kmarkdown?.mention_part ?? []
    for (const item of mention_part) {
      at_users.push({
        id: item.id,
        name: item.username,
        avatar: item.avatar,
        bot: false
      })
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

    const UserKey = createHash(`kook:${event.author_id}`)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      //
      GuildId: event.extra.guild_id,
      ChannelId: event.target_id,
      // 用户Id
      UserId: event.author_id,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      // message
      MessageId: event.msg_id,
      MessageBody: [
        Text(msg),
        ...at_users.map(item =>
          At(item.id, 'user', { name: item.name, avatar: item.avatar, bot: item.bot })
        )
      ],
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
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = useParse(
            {
              MessageBody: val
            },
            'Text'
          )
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
          const images = useParse(
            {
              MessageBody: val
            },
            'Image'
          )
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
        }
      }
    }
  }
})
