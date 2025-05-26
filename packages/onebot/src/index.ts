import {
  cbpPlatform,
  createResult,
  DataEnums,
  getConfigValue,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  ResultCode,
  User,
  useUserHashKey
} from 'alemonjs'
import { OneBotClient } from './sdk/wss'
import { readFileSync } from 'fs'

const MyBot = {
  id: '',
  name: '',
  avatar: ''
}

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
  return Buffer.from(arrayBuffer)
}

export const platform = 'onebot'

export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
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
  client.connect()

  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  client.on('META', event => {
    if (event?.self_id) {
      MyBot.id = String(event.self_id)
    }
  })

  client.on('MESSAGES', event => {
    const uis = config?.master_id ?? []
    let msg = ''
    const arr: {
      text: string
    }[] = []
    for (const item of event.message) {
      if (item.type == 'text') {
        msg = item.data.text
      }
    }
    for (const item of arr) {
      msg = msg.replace(item.text, '').trim()
    }

    const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`

    const UserAvatar = url

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
      MessageText: msg.trim(),
      // 用户openId
      OpenId: String(event.user_id),
      // 创建时间
      CreateAt: Date.now(),
      // 标签
      tag: 'message.create',
      value: event
    }
    cbp.send(e)
  })

  client.on('DIRECT_MESSAGE', event => {
    const uis = config?.master_id ?? []
    let msg = ''
    const arr: {
      text: string
    }[] = []
    for (const item of event.message) {
      if (item.type == 'text') {
        msg = item.data.text
      }
    }
    for (const item of arr) {
      msg = msg.replace(item.text, '').trim()
    }

    const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`

    const UserAvatar = url

    const UserId = String(event.user_id)
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId
    })

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 平台类型
      Platform: platform,
      // 频道
      // GuildId: String(event.group_id),
      // 子频道
      // ChannelId: String(event.group_id),
      IsMaster: uis.includes(String(event.user_id)),
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      // message
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      // 用户openId
      OpenId: String(event.user_id),
      // 创建时间
      CreateAt: Date.now(),
      // 标签
      tag: 'private.message.create',
      value: event
    }
    cbp.send(e)
  })

  // 错误处理
  client.on('ERROR', event => {
    console.error('ERROR', event)
  })

  const sendGroup = async (event, val: DataEnums[]) => {
    if (val.length < 0) return Promise.all([])
    const content = val
      .filter(item => item.type == 'Mention' || item.type == 'Text')
      .map(item => item.value)
      .join('')
    if (content) {
      return Promise.all(
        [content].map(item => {
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
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: null
          })
        })
      )
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images) {
      return Promise.all(
        images.map(async item => {
          let data: Buffer = null
          if (item.type === 'ImageFile') {
            const db = readFileSync(item.value)
            data = db
          } else if (item.type === 'ImageURL') {
            const db = await ImageURLToBuffer(item.value)
            data = db
          } else {
            // data = item.value
            data = Buffer.from(item.value, 'base64')
          }
          client.sendGroupMessage({
            group_id: event.ChannelId,
            message: [
              {
                type: 'image',
                data: {
                  file: `base64://${data.toString('base64')}`
                }
              }
            ]
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: null
          })
        })
      )
    }
    return Promise.all([])
  }

  /**
   *
   * @param event
   * @param val
   * @returns
   */
  const sendPrivate = async (event, val: DataEnums[]) => {
    if (val.length < 0) return Promise.all([])
    const content = val
      .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
      .map(item => item.value)
      .join('')
    if (content) {
      return Promise.all(
        [content].map(item => {
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
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: null
          })
        })
      ).catch(err => [
        createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
      ])
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images) {
      return Promise.all(
        images.map(async item => {
          let data: Buffer = null
          if (item.type === 'ImageFile') {
            const db = readFileSync(item.value)
            data = db
          } else if (item.type === 'ImageURL') {
            const db = await ImageURLToBuffer(item.value)
            data = db
          } else {
            // data = item.value
            data = Buffer.from(item.value, 'base64')
          }
          client.sendGroupMessage({
            group_id: event.ChannelId,
            message: [
              {
                type: 'image',
                data: {
                  file: `base64://${data.toString('base64')}`
                }
              }
            ]
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: null
          })
        })
      ).catch(err => [
        createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
      ])
    }
    return Promise.all([])
  }

  const api = {
    active: {
      send: {
        channel: (event, val) => {
          return sendGroup(event, val)
        },
        user: (event, val) => {
          return sendPrivate(event, val)
        }
      }
    },
    use: {
      send: (event, val) => {
        if (val.length < 0) return Promise.all([])
        if (event['name'] == 'private.message.create') {
          return sendPrivate(event, val)
        } else if (event['name'] == 'message.create') {
          return sendGroup(event, val)
        }
        return Promise.all([])
      },
      mention: async event => {
        const uis = config?.master_id ?? []
        const e = event.value
        if (event['name'] == 'message.create' || event['name'] == 'private.message.create') {
          const Metions: User[] = []
          for (const item of e.message) {
            if (item.type == 'at') {
              let isBot = false
              const uid = String(item.data.qq)
              if (uid == 'all') {
                continue
              }
              if (uid == MyBot.id) {
                isBot = true
              }
              const avatar = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${uid}`
              Metions.push({
                UserId: uid,
                UserKey: useUserHashKey({
                  Platform: platform,
                  UserId: uid
                }),
                UserName: item.data?.nickname,
                UserAvatar: avatar,
                IsMaster: uis.includes(uid),
                IsBot: isBot
              })
            }
          }
          return Metions
        }
        return []
      }
    }
  }
  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      const res = await api.use.send(event, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.channel') {
      const channel_id = data.payload.ChannelId
      const val = data.payload.params.format
      const res = await api.active.send.channel(channel_id, val)
      consume(res)
    } else if (data.action === 'message.send.user') {
      const user_id = data.payload.UserId
      const val = data.payload.params.format
      const res = await api.active.send.user(user_id, val)
      consume(res)
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      const res = await api.use.mention(event)
      consume(res)
    }
  })
}
