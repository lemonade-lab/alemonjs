import { At, defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import { OneBotClient } from './sdk-v11/wss'

const MyBot = {
  id: '',
  name: '',
  avatar: ''
}

export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.onebot
  if (!config) return

  //
  const client = new OneBotClient({
    // url
    url: config?.url ?? '',
    // token
    access_token: config?.token ?? ''
  })

  //
  client.connect()

  //
  client.on('META', event => {
    if (event?.self_id) {
      MyBot.id = String(event.self_id)
    }
  })

  //
  client.on('MESSAGES', event => {
    const uis = config.master_uids ?? []
    let msg = ''
    const arr = []
    let at_users = []
    for (const item of event.message) {
      if (item.type == 'text') {
        msg = item.data.text
      }
    }
    for (const item of arr) {
      msg = msg.replace(item.text, '').trim()
    }
    // 定义消
    const e = {
      // 平台类型
      Platform: 'onebot',
      // 频道
      GuildId: String(event.group_id),
      // guild_name: event.group_name,
      // 子频道
      ChannelId: String(event.group_id),
      // 是否是主人
      IsMaster: uis.includes(String(event.user_id)),
      // 用户ID
      UserId: String(event.user_id),
      GuildIdName: '',
      GuildIdAvatar: '',
      ChannelName: '',
      // 用户名
      UserName: event.sender.nickname,
      // 用户头像
      UserAvatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`,
      // 格式化数据
      MsgId: String(event.message_id),
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
      // 用户openId
      OpenID: String(event.user_id),
      // 创建时间
      CreateAt: Date.now(),
      // 标签
      tag: 'MESSAGES',
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

  client.on('DIRECT_MESSAGE', () => {
    // const e = {
    //   isMaster: event.user_id == masterID,
    //   msg_txt: event.raw_message,
    //   msg: event.raw_message.trim(),
    //   msg_id: event.message_id,
    //   open_id: event.user_id,
    //   user_id: event.user_id,
    //   user_avatar:
    //     event.platform == 'qq'
    //       ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`
    //       : '',
    //   user_name: event.sender.nickname,
  })

  // 错误处理
  client.on('ERROR', event => {
    console.error('ERROR', event)
  })

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
                client.sendGroupMsg({
                  group_id: event.ChannelId,
                  message: [
                    {
                      type: 'text',
                      data: {
                        text: item
                      }
                    }
                  ]
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
              images.map(item =>
                client.sendGroupMsg({
                  group_id: event.ChannelId,
                  message: [
                    {
                      type: 'image',
                      data: {
                        file: `base64://${item.toString('base64')}`
                      }
                    }
                  ]
                })
              )
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
