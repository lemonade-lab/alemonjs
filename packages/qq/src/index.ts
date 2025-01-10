import {
  defineBot,
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  useUserHashKey,
  getConfigValue,
  User
} from 'alemonjs'
import { Client as ICQQClient, PrivateMessageEvent, segment, Sendable } from 'icqq'
import { device, error, qrcode, slider } from './login'
import { Store } from './store'
export type Client = typeof ICQQClient.prototype
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export const platform = 'qq'
export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
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
    const value = getConfigValue()
    const config = value?.qq
    const master_key: string[] = config?.master_key ?? []
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
    const value = getConfigValue()
    const config = value?.qq
    const master_key: string[] = config?.master_key ?? []
    const user_id = String(event.sender.user_id)
    const group_id = String(event.group_id)
    const isMaster = master_key.includes(user_id)

    let msg = ''

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

    const UserId = user_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
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
      MessageText: msg,
      OpenId: user_id,
      CreateAt: Date.now(),
      // other
      tag: 'message.group',
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

  // 监听消息
  client.on('message.private', async event => {
    const value = getConfigValue()
    const config = value?.qq
    const master_key: string[] = config?.master_key ?? []
    const user_id = String(event.sender.user_id)
    const isMaster = master_key.includes(user_id)
    let msg = ''
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

    const UserId = user_id
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户
      UserId: user_id,
      UserName: event.sender.nickname,
      UserAvatar: UserAvatar,
      UserKey,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.message_id,
      MessageText: msg,
      OpenId: user_id,
      CreateAt: Date.now(),
      // other
      tag: 'message.private',
      value: null
    }
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
        send: async (event, val) => {
          if (val.length < 0) return []
          try {
            const content: Sendable = val
              .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
              .map(item => {
                if (item.type == 'Link') {
                  return segment.share(item.value, item.options?.title ?? item.value)
                } else if (item.type == 'Mention') {
                  if (
                    item.value == 'everyone' ||
                    item.value == 'all' ||
                    item.value == '' ||
                    typeof item.value != 'string'
                  ) {
                    return segment.at('all')
                  }
                  if (item.options?.belong == 'user') {
                    return segment.at(item.value)
                  }
                  return segment.text('')
                } else if (item.type == 'Text') {
                  return segment.text(item.value)
                }
                return segment.text('')
              })
            if (content) {
              return await Promise.all([client.pickGroup(event.ChannelId).sendMsg(content)])
            }
            const images = val.filter(item => item.type == 'Image').map(item => item.value)
            if (images) {
              return await Promise.all([
                client.pickGroup(event.ChannelId).sendMsg(images.map(item => segment.image(item)))
              ])
            }
          } catch (e) {
            return [e]
          }
          return []
        },
        mention: async e => {
          let event: PrivateMessageEvent = e.value
          const value = getConfigValue()
          const config = value?.qq
          const master_key: string[] = config?.master_key ?? []
          const MessageMention: User[] = []
          for (const item of event.message) {
            if (item.type == 'at') {
              if (item.qq == 'all') continue
              const UserId = String(item.qq)
              const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.qq}`
              const UserAvatar = {
                toBuffer: async () => {
                  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
                  return Buffer.from(arrayBuffer)
                },
                toBase64: async () => {
                  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
                  return Buffer.from(arrayBuffer).toString('base64')
                },
                toURL: async () => url
              }
              const UserKey = useUserHashKey({
                Platform: platform,
                UserId: UserId
              })
              MessageMention.push({
                UserId: UserId,
                UserName: '',
                UserAvatar: UserAvatar,
                UserKey: UserKey,
                IsMaster: master_key.includes(UserId),
                IsBot: item.qq == qq
              })
            }
          }
          return MessageMention
        }
      }
    }
  }
})
