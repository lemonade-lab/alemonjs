import {
  cbpPlatform,
  createResult,
  DataEnums,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  ResultCode,
  User
} from 'alemonjs'
import { getBufferByURL } from 'alemonjs/utils'
import { OneBotClient } from './sdk/wss'
import { readFileSync } from 'fs'
import { platform, getOneBotConfig, getMaster } from './config'

const MyBot = {
  id: '',
  name: '',
  avatar: ''
}

export { platform } from './config'

export { OneBotAPI as API } from './sdk/api'

export default () => {
  const config = getOneBotConfig()
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

  const createUserAvatar = (id: string) => {
    return `https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`
  }

  const getMessageText = (message: any[]) => {
    let msg = ''
    for (const item of message) {
      if (item.type == 'text') {
        msg += item.data.text
      }
    }
    return msg.trim()
  }

  client.on('META', event => {
    if (event?.self_id) {
      MyBot.id = String(event.self_id)
    }
  })

  client.on('MESSAGES', event => {
    const msg = getMessageText(event.message)
    const UserId = String(event.user_id)
    const UserAvatar = createUserAvatar(UserId)

    const [isMaster, UserKey] = getMaster(UserId)

    const groupId = String(event.group_id)

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      Platform: platform,
      GuildId: groupId,
      ChannelId: groupId,
      IsMaster: isMaster,
      SpaceId: groupId,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      OpenId: UserId,
      CreateAt: Date.now(),
      tag: 'message.create',
      value: event
    }
    cbp.send(e)
  })

  client.on('DIRECT_MESSAGE', event => {
    const msg = getMessageText(event.message)
    const UserId = String(event.user_id)
    const UserAvatar = createUserAvatar(UserId)

    const [isMaster, UserKey] = getMaster(UserId)

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      Platform: platform,
      IsMaster: isMaster,
      IsBot: false,
      UserId: UserId,
      UserName: event.sender.nickname,
      UserKey,
      UserAvatar: UserAvatar,
      MessageId: String(event.message_id),
      MessageText: msg.trim(),
      OpenId: String(event.user_id),
      CreateAt: Date.now(),
      tag: 'private.message.create',
      value: event
    }
    cbp.send(e)
  })

  // 错误处理
  client.on('ERROR', event => {
    logger.error(event)
  })

  const sendGroup = async (ChannelId: number, val: DataEnums[]) => {
    if (val.length < 0) return []
    const content = val
      .filter(item => item.type == 'Mention' || item.type == 'Text')
      .map(item => item.value)
      .join('')
    try {
      if (content) {
        const res = await client.sendGroupMessage({
          group_id: ChannelId,
          message: [
            {
              type: 'text',
              data: {
                text: content
              }
            }
          ]
        })
        return [createResult(ResultCode.Ok, 'client.groupOpenMessages', res)]
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
              const db = await getBufferByURL(item.value)
              data = db
            } else {
              // data = item.value
              data = Buffer.from(item.value, 'base64')
            }
            client.sendGroupMessage({
              group_id: ChannelId,
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
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.groupOpenMessages', error)]
    }
    return []
  }

  /**
   *
   * @param UserId
   * @param val
   * @returns
   */
  const sendPrivate = async (UserId: number, val: DataEnums[]) => {
    if (val.length < 0) return Promise.all([])
    const content = val
      .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
      .map(item => item.value)
      .join('')
    try {
      if (content) {
        const res = await client.sendPrivateMessage({
          user_id: UserId,
          message: [
            {
              type: 'text',
              data: {
                text: content
              }
            }
          ]
        })
        return [createResult(ResultCode.Ok, 'client.sendPrivateMessage', res)]
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
              const db = await getBufferByURL(item.value)
              data = db
            } else {
              // data = item.value
              data = Buffer.from(item.value, 'base64')
            }
            client.sendPrivateMessage({
              user_id: UserId,
              message: [
                {
                  type: 'image',
                  data: {
                    file: `base64://${data.toString('base64')}`
                  }
                }
              ]
            })
            return createResult(ResultCode.Ok, 'client.sendPrivateMessage', {
              id: null
            })
          })
        )
      }
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.sendPrivateMessage', error)]
    }
    return []
  }

  const api = {
    active: {
      send: {
        channel: async (SpaceId: string, val: DataEnums[]) => {
          return sendGroup(Number(SpaceId), val)
        },
        user: async (OpenId: string, val: DataEnums[]) => {
          return sendPrivate(Number(OpenId), val)
        }
      }
    },
    use: {
      send: (
        event: {
          name: string
          UserId?: string
          ChannelId?: string
        },
        val: DataEnums[]
      ) => {
        if (val.length < 0) return Promise.all([])
        if (event['name'] == 'private.message.create') {
          const UserId = Number(event.UserId)
          return sendPrivate(UserId, val)
        } else if (event['name'] == 'message.create') {
          const GroupId = Number(event.ChannelId)
          return sendGroup(GroupId, val)
        }
        return Promise.all([])
      },
      mention: async event => {
        const e = event.value
        const names = ['message.create', 'private.message.create']
        if (names.includes(event.name)) {
          const Metions: User[] = []
          for (const item of e.message) {
            if (item.type == 'at') {
              let isBot = false
              const UserId = String(item.data.qq)
              if (UserId == 'all') {
                continue
              }
              if (UserId == MyBot.id) {
                isBot = true
              }
              const [isMaster, UserKey] = getMaster(UserId)
              const avatar = createUserAvatar(UserId)
              Metions.push({
                UserId: UserId,
                IsMaster: isMaster,
                UserKey: UserKey,
                UserName: item.data?.nickname,
                UserAvatar: avatar,
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
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })

  // 处理 api 调用
  cbp.onapis(async (data, consume) => {
    const key = data.payload?.key
    if (client[key]) {
      const params = data.payload.params
      const res = await client[key](...params)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })
}
