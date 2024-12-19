import { At, createHash, defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import { OneBotClient } from './sdk-v12/wss'

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
    const bot = event.status.bots[0]
    if (!bot) return
    if (bot.self) {
      MyBot.id = bot.self.user_id
    }
    if (bot.nickname) {
      MyBot.name = bot.nickname
    }
    if (bot.avatar) {
      MyBot.avatar = bot?.avatar ?? ''
    }
  })

  //
  client.on('MESSAGES', event => {
    const uis = config.master_uids ?? []
    let msg = ''
    const arr = []
    let at_users = []
    for (const item of event.message) {
      if (item.type == 'mention') {
        arr.push(item.data)
        at_users.push({
          avatar: '',
          bot: false,
          id: item.data.user_id,
          name: item.data.text.replace(/^@/, '')
        })
      } else if (item.type == 'text') {
        msg = item.data.text
      }
    }
    for (const item of arr) {
      msg = msg.replace(item.text, '').trim()
    }

    const url = event.platform == 'qq' ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}` : ''

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
    const UserKey = createHash(`onebot:${event.user_id}`)

    // 定义消
    const e = {
      // 平台类型
      Platform: 'onebot',
      // 频道
      GuildId: event.group_id,
      // guild_name: event.group_name,
      // 子频道
      ChannelId: event.group_id,
      // 是否是主人
      IsMaster: uis.includes(String(event.user_id)),
      // 用户Id
      UserId: event.user_id,
      UserKey,
      // 用户名
      UserName: event.sender.nickname,
      // 用户头像
      UserAvatar: UserAvatar,
      // 格式化数据
      MessageId: event.message_id,
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
      // 表情
      // 用户openId
      OpenId: event.user_id,
      //
      tag: 'MESSAGES',
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

  client.on('DIRECT_MESSAGE', () => {
    // const e = {
    //   isMaster: event.user_id == masterId,
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
    console.error(event)
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
                client.sendGroupMessage({
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
                client.sendGroupMessage({
                  group_id: event.ChannelId,
                  message: [
                    {
                      type: 'image',
                      data: {
                        file_id: item
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
