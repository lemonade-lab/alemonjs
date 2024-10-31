import { defineBot, Text, OnProcessor, useParse, At, getConfig } from 'alemonjs'
import { KOOKClient } from 'chat-space'

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

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: event.extra.guild_id,
      // 子频道
      ChannelId: event.target_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户ID
      UserId: event.author_id,
      // 用户名
      UserName: event.extra.author.username,
      // 用户头像
      UserAvatar: avatar.substring(0, avatar.indexOf('?')),
      // 格式化数据
      MsgId: event.msg_id,
      // 用户消息
      Megs: [
        Text(msg),
        ...at_users.map(item =>
          At(item.id, 'user', { name: item.name, avatar: item.avatar, bot: item.bot })
        )
      ],
      // 用户openId
      OpenID: data?.code,
      // 创建时间
      CreateAt: Date.now(),
      // 表情
      tag: 'MESSAGES_PUBLIC',
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

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = useParse(val, 'Text')
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
          return Promise.all([])
        }
      }
    }
  }
})
