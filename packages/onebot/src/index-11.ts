import { createHash, defineBot, getConfig, OnProcessor } from 'alemonjs'
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

    const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`

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
      GuildId: String(event.group_id),
      // guild_name: event.group_name,
      // 子频道
      ChannelId: String(event.group_id),
      // 是否是主人
      IsMaster: uis.includes(String(event.user_id)),
      IsBot: false,
      // 用户Id
      UserId: String(event.user_id),
      // 用户名
      UserName: event.sender.nickname,
      UserKey,
      // 用户头像
      UserAvatar: UserAvatar,
      // 格式化数据
      MessageId: String(event.message_id),
      // 用户消息
      MessageText: msg,
      MessageMention: [],
      // 用户openId
      // 用户openId
      OpenId: String(event.user_id),
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
    console.error('ERROR', event)
  })

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = val
            .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
            .map(item => item.value)
            .join('')
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
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(item =>
                client.sendGroupMessage({
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
