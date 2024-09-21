import { ConfigType, Text, OnProcessor, AEvents, useParse } from 'alemonjs'
import { KOOKClient } from 'chat-space'
/**
 *
 * @param val
 */
export const login = (config: ConfigType) => {
  // 创建客户端
  const client = new KOOKClient({
    token: config.token
  })

  // 连接
  client.connect()

  // 监听消息
  client.on('MESSAGES_PUBLIC', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) return false

    // 私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data)

    let msg = event?.extra?.kmarkdown?.raw_content ?? event.content

    const avatar = event.extra.author.avatar

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.extra.guild_id,
      // 子频道
      ChannelId: event.target_id,
      // 用户ID
      UserId: event.author_id,
      // 用户名
      UserName: event.extra.author.username,
      // 用户头像
      UserAvatar: avatar.substring(0, avatar.indexOf('?')),
      // 格式化数据
      MsgId: event.msg_id,
      // 用户消息
      Megs: [Text(msg)],
      // 用户openId
      OpenID: data?.code,
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
            console.log(fn, arg)
            return
          },
          send: (event: AEvents['message.create'], val: any[]) => {
            if (val.length < 0) return
            const content = useParse(val, 'Text')
            if (content) {
              return client.createMessage({
                type: 9,
                target_id: event.ChannelId,
                content: content
              })
            }
            const images = useParse(val, 'Image')
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
            return Promise.resolve()
          },
          reply: (event: AEvents['message.create'], val: any[]) => {
            console.log(event, val)
            return
          },
          withdraw: (event: AEvents['message.create'], val: any[]) => {
            console.log(event, val)
            return
          }
        }
      }
    }
  }
}
