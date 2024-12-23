import {
  defineBot,
  Text,
  OnProcessor,
  getConfig,
  createHash,
  PrivateEventMessageCreate,
  PublicEventMessageCreate
} from 'alemonjs'
import { Client as ICQQClient, segment } from 'icqq'
import { device, error, qrcode, slider } from './login'
import { Store } from './store'
export type Client = typeof ICQQClient.prototype
export const client: Client = global.client
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.qq
  if (!config) return

  const d = Number(config?.device)
  // 创建客户端
  const client = new ICQQClient({
    // 机器人配置
    sign_api_addr: config?.sign_api_addr,
    // 默认要扫码登录
    platform: isNaN(d) ? 3 : d,
    // 默认版本
    ver: config?.ver
  })
  const qq = Number(config.qq)
  // 主人
  const master_key: string[] = config?.master_key ?? []

  // 连接
  client.login(qq, config.password)
  // 错误
  client.on('system.login.error', event => error(event))
  // 设备
  client.on('system.login.device', event => device(client, event))
  // 二维码
  client.on('system.login.qrcode', () => qrcode(client))
  // 滑块
  client.on('system.login.slider', event => slider(client, event, qq))

  const LocalStore = new Store()

  // 登录
  client.on('system.online', async () => {
    if (master_key[0]) {
      const val = LocalStore.getItem()
      const Now = Date.now()
      if (!val || !val.RunAt || Now > Now + 1000 * 60 * 24) {
        LocalStore.setItem({
          RunAt: Now
        })
        const UserId = Number(master_key[0])
        // 是否是好友
        const friend = client.fl.get(UserId)
        if (!friend) return
        // send
        client.pickUser(UserId).sendMsg('欢迎使用[ @AlemonJS/QQ ]')
      }
    }
  })

  // 监听消息
  client.on('message.group', async event => {
    const user_id = String(event.sender.user_id)
    const group_id = String(event.group_id)
    const isMaster = master_key.includes(user_id)

    let msg = ''
    const Ats = []

    //
    for (const val of event.message) {
      switch (val.type) {
        case 'text': {
          msg = (val?.text || '')
            .replace(/^\s*[＃井#]+\s*/, '#')
            .replace(/^\s*[\\*※＊]+\s*/, '*')
            .trim()
          break
        }
        case 'at': {
          if (val.qq == 'all') {
            // everyone
            Ats.push({
              type: 'At',
              value: 'everyone',
              typing: 'everyone',
              name: 'everyone',
              avatar: 'everyone',
              bot: false
            })
          } else {
            // user
            Ats.push({
              type: 'At',
              value: String(val.qq),
              typing: 'user',
              name: '',
              avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${val.qq}`,
              bot: val.qq == qq
            })
          }
          break
        }
      }
    }

    const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`

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

    const UserKey = createHash(`qq:${user_id}`)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq',
      // 频道
      GuildId: group_id,
      ChannelId: group_id,
      // 用户
      UserId: user_id,
      UserName: event.sender.nickname,
      UserAvatar: UserAvatar,
      UserKey,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.message_id,
      MessageBody: [Text(msg)].concat(Ats),
      MessageText: msg,
      OpenId: user_id,
      CreateAt: Date.now(),
      // other
      tag: 'message.group',
      value: null
    } as PublicEventMessageCreate
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return event
      }
    })
    // 处理消息
    OnProcessor(e, 'message.create')
  })

  // 监听消息
  client.on('message.private', async event => {
    const user_id = String(event.sender.user_id)
    const isMaster = master_key.includes(user_id)
    let msg = ''
    const Ats = []

    const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`

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

    const UserKey = createHash(`qq:${user_id}`)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq',
      // 用户
      UserId: user_id,
      UserName: event.sender.nickname,
      UserAvatar: UserAvatar,
      UserKey,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.message_id,
      MessageBody: [Text(msg)].concat(Ats),
      MessageText: msg,
      OpenId: user_id,
      CreateAt: Date.now(),
      // other
      tag: 'message.private',
      value: null
    } as PrivateEventMessageCreate
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return event
      }
    })
    // 处理消息
    OnProcessor(e, 'private.message.create')
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
              [content].map(item => client.pickGroup(event.ChannelId).sendMsg(item))
            )
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(
              images.map(async item => {
                return await client.pickGroup(event.ChannelId).sendMsg(segment.image(item))
              })
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
