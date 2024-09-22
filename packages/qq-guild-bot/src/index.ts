import { ConfigType, Text, OnProcessor, AEvents, useParse, At } from 'alemonjs'
import { QQBotGuildClient } from 'chat-space'
/**
 *
 * @param val
 */
export const login = (config: ConfigType) => {
  // 创建客户端
  const client = new QQBotGuildClient({
    appID: config.app_id,
    token: config.token
  })

  // 连接
  client.connect()

  // 监听消息
  client.on('AT_MESSAGE_CREATE', async event => {
    console.log('AT_MESSAGE_CREATE', event)

    // 屏蔽其他机器人的消息
    if (event?.author?.bot) return

    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)

    let msg = event?.content ?? ''

    // 艾特消息处理
    const at_users: {
      id: string
      name: string
      avatar: string
      bot: boolean
    }[] = []

    if (event.mentions) {
      // 去掉@ 转为纯消息
      for await (const item of event.mentions) {
        at_users.push({
          id: item.id,
          name: item.username,
          avatar: item.avatar,
          bot: item.bot
        })
      }
      // 循环删除文本中的at信息并去除前后空格
      at_users.forEach(item => {
        msg = msg.replace(`<@!${item.id}>`, '').trim()
      })
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.guild_id,
      // 子频道
      ChannelId: event.channel_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户ID
      UserId: event?.author?.id ?? '',
      // 用户名
      UserName: event?.author?.username ?? '',
      // 用户头像
      UserAvatar: event?.author?.avatar ?? '',
      // 格式化数据
      MsgId: event.id,
      // 用户消息
      Megs: [
        Text(msg ?? ''),
        ...at_users.map(item =>
          At(item.name, 'user', {
            name: item.name,
            avatar: item.avatar,
            bot: item.bot
          })
        )
      ],
      // 用户openId
      OpenID: event.guild_id,
      // 创建时间
      CreateAt: Date.now(),
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

  // 私域 -
  client.on('MESSAGE_CREATE', async event => {
    console.log('MESSAGE_CREATE', event)

    // 屏蔽其他机器人的消息
    if (event.author?.bot) return
    // 撤回消息
    if (new RegExp(/DELETE$/).test(event.eventType)) return

    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)

    let msg = event?.content ?? ''

    // 艾特消息处理
    const at_users: {
      id: string
      name: string
      avatar: string
      bot: boolean
    }[] = []

    if (event.mentions) {
      // 去掉@ 转为纯消息
      for await (const item of event.mentions) {
        at_users.push({
          id: item.id,
          name: item.username,
          avatar: item.avatar,
          bot: item.bot
        })
      }
      // 循环删除文本中的at信息并去除前后空格
      at_users.forEach(item => {
        msg = msg.replace(`<@!${item.id}>`, '').trim()
      })
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.guild_id,
      // 子频道
      ChannelId: event.channel_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户ID
      UserId: event?.author?.id ?? '',
      // 用户名
      UserName: event?.author?.username ?? '',
      // 用户头像
      UserAvatar: event?.author?.avatar ?? '',
      // 格式化数据
      MsgId: event.id,
      // 用户消息
      Megs: [
        Text(msg ?? ''),
        ...at_users.map(item =>
          At(item.name, 'user', {
            name: item.name,
            avatar: item.avatar,
            bot: item.bot
          })
        )
      ],
      // 用户openId
      OpenID: event.guild_id,
      // 创建时间
      CreateAt: Date.now(),
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

  /**
   * 开始实现全局接口
   */
  if (!global?.alemonjs) {
    global.alemonjs = {
      api: {
        use: {
          send: (event: AEvents['message.create'], val: any[]) => {
            if (val.length < 0) return
            const content = useParse(val, 'Text')
            if (content) {
              return Promise.all(
                [content].map(item =>
                  client.channelsMessagesPost(event.ChannelId, {
                    content: item,
                    msg_id: event.MsgId
                  })
                )
              )
            }
            const images = useParse(val, 'Image')
            if (images) {
              return Promise.all(
                images.map(item =>
                  client.postImage(event.ChannelId, {
                    msg_id: event.MsgId,
                    image: item
                  })
                )
              )
            }
            return Promise.resolve()
          }
        }
      }
    }
  }
}
