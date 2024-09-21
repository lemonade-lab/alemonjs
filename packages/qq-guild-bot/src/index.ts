import { ConfigType, Text, OnProcessor, AEvents, useParse } from 'alemonjs'
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
    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.guild_id,
      // 子频道
      ChannelId: event.channel_id,
      // 用户ID
      UserId: event?.author?.id ?? '',
      // 用户名
      UserName: event?.author?.username ?? '',
      // 用户头像
      UserAvatar: event?.author?.avatar ?? '',
      // 格式化数据
      MsgId: event.id,
      // 用户消息
      Megs: [Text(event?.content ?? '')],
      // 用户openId
      OpenID: event.guild_id,
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
            return client.channelsMessagesPost(event.GuildId, {
              content,
              msg_id: event.MsgId
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
