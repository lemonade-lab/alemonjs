import { Text, OnProcessor, useParse, At, defineBot, getConfig, createHash } from 'alemonjs'
import { DCClient } from './sdk/index'
export type Client = typeof DCClient.prototype
export const client: Client = global.client
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.discord
  if (!config) return

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

    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)

    // 艾特消息处理
    const at_users: {
      id: string
      name: string
      avatar: string
      bot: boolean
    }[] = []

    // 获取艾特用户
    for (const item of event.mentions) {
      at_users.push({
        id: item.id,
        name: item.username,
        avatar: client.userAvatar(item.id, item.avatar),
        bot: item.bot
      })
    }

    // 清除 @ 相关的消息
    let msg = event.content
    for await (const item of at_users) {
      msg = msg.replace(`<@${item.id}>`, '').trim()
    }

    const UserKey = createHash(`gui:${event.author.id}`)

    let url: null | string = null
    const UserAvatar = {
      toBuffer: async () => {
        if (!url) {
          url = client.userAvatar(event.author.id, event.author.avatar)
        }
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer)
      },
      toBase64: async () => {
        if (!url) {
          url = client.userAvatar(event.author.id, event.author.avatar)
        }
        const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
        return Buffer.from(arrayBuffer).toString('base64')
      },
      toURL: async () => {
        if (!url) {
          url = client.userAvatar(event.author.id, event.author.avatar)
        }
        return url
      }
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: 'discord',
      // 频道
      GuildId: event.guild_id,
      // 子频道
      ChannelId: event.channel_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户Id
      UserId: event.author.id,
      // 用户名
      UserName: event.author.username,
      UserKey,
      // 用户头像
      UserAvatar: UserAvatar,
      // 格式化数据
      MessageId: event.id,
      // 用户消息
      MessageBody: [
        Text(msg),
        ...at_users.map(item =>
          At(item.id, 'user', {
            name: item.name,
            avatar: item.avatar,
            bot: item.bot
          })
        )
      ],
      MessageText: msg,
      // 用户openId
      OpenId: '',
      // 创建时间
      CreateAt: Date.now(),
      tag: 'MESSAGE_CREATE',
      //
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
                client.channelsMessages(event.ChannelId, {
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
              images.map(item => client.channelsMessagesImage(event.ChannelId, item))
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
