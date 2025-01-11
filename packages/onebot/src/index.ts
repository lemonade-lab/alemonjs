import {
  defineBot,
  getConfigValue,
  OnProcessor,
  PublicEventMessageCreate,
  useUserHashKey
} from 'alemonjs'
import { OneBotClient } from './sdk/wss'

const MyBot = {
  id: '',
  name: '',
  avatar: ''
}

export type Client = typeof OneBotClient.prototype

export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      const original = global.client[prop]
      // 防止函数内this丢失
      return typeof original === 'function' ? original.bind(global.client) : original
    }
    return undefined
  }
})

export const platform = 'onebot'

export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  //
  const client = new OneBotClient({
    // url
    url: config?.url ?? '',
    // token
    access_token: config?.token ?? '',
    // 是否开启反向连接，正向连接失效
    reverse_enable: config?.reverse_enable ?? false,
    // 反向连接端口
    reverse_port: config?.reverse_port ?? 17158
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
    const arr: {
      text: string
    }[] = []
    // let at_users = []
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

    const UserId = String(event.user_id)
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 平台类型
      Platform: platform,
      // 频道
      GuildId: String(event.group_id),
      // guild_name: event.group_name,
      // 子频道
      ChannelId: String(event.group_id),
      IsMaster: uis.includes(String(event.user_id)),
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      // message
      MessageId: String(event.message_id),
      MessageText: msg,
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

  global.client = client

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
        },
        mention: async () => {
          return []
        }
      }
    }
  }
})
