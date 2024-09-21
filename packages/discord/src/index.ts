import { ConfigType, Text, OnProcessor, AEvents, useParse } from 'alemonjs'
import { DCClient } from 'chat-space'
/**
 *
 * @param val
 */
export const login = (config: ConfigType) => {
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

    /**
     * 艾特消息处理
     */
    const at_users: any[] = []

    /**
     * 切割
     */
    for (const item of event.mentions) {
      at_users.push({
        id: item.id,
        name: item.username,
        avatar: client.userAvatar(item.id, item.avatar),
        bot: item.bot
      })
    }

    /**
     * 清除 @ 相关
     */
    let msg = event.content
    for await (const item of at_users) {
      msg = msg.replace(`<@${item.id}>`, '').trim()
    }

    /**
     * 艾特处理
     */
    let at = false
    let at_user: undefined = undefined
    if (at_users.some(item => item.bot != true)) {
      at = true
    }
    if (at) {
      at_user = at_users.find(item => item.bot != true)
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.guild_id,
      // 子频道
      ChannelId: event.channel_id,
      // 用户ID
      UserId: event.author.id,
      // 用户名
      UserName: event.author.username,
      // 用户头像
      UserAvatar: client.userAvatar(event.author.id, event.author.avatar),
      // 格式化数据
      MsgId: event.id,
      // 用户消息
      Megs: [Text(event.content.trim())],
      // 用户openId
      OpenID: '',
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
          observer: (fn: Function, arg: string[]) => {
            return
          },
          send: (event: AEvents['message.create'], val: any[]) => {
            if (val.length < 0) return
            const content = useParse('Text', val)
            return client.channelsMessages(event.ChannelId, {
              content
            })
          },
          reply: (event: AEvents['message.create'], val: any[]) => {
            return
          },
          withdraw: (event: AEvents['message.create'], val: any[]) => {
            return
          }
        }
      }
    }
  }
}
