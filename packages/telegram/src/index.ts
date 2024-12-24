import { defineBot, getConfigValue, OnProcessor, useUserHashKey } from 'alemonjs'
import TelegramClient from 'node-telegram-bot-api'
export type Client = typeof TelegramClient.prototype
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export const platform = 'telegram'
export default defineBot(() => {
  const value = getConfigValue()
  const config = value?.telegram
  if (!config) return

  //
  const client = new TelegramClient(config.token, {
    polling: true,
    baseApiUrl: config?.base_api_url ?? '',
    request: {
      url: config?.request_url ?? '',
      proxy: config?.proxy ?? ''
    }
  })
  /**
   *
   * @param UserId
   * @returns
   */
  const getUserProfilePhotosUrl = (UserId: number) => {
    return new Promise((resolve, reject) => {
      if (!UserId) {
        reject(new Error('UserId 不能为空'))
        return
      }
      client
        .getUserProfilePhotos(UserId)
        .then(profilePhotos => {
          if (profilePhotos.total_count > 0) {
            // 获取第一张头像的文件 Id
            const fileId = profilePhotos.photos[0][0].file_id
            // 获取文件信息以获取下载链接
            client
              .getFile(fileId)
              .then(file => {
                const filePath = file.file_path
                resolve(`https://api.telegram.org/file/bot${config.token}/${filePath}`)
              })
              .catch(reject)
          } else {
            reject(new Error('用户没有头像'))
          }
        })
        .catch(reject)
    })
  }

  client.on('text', async event => {
    const UserId = String(event?.from?.id)
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    const UserAvatar = {
      toBuffer: async () => {
        if (event?.chat.type == 'supergroup' || event?.chat.type == 'private') {
          const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
          if (typeof photo == 'string') {
            const arrayBuffer = await fetch(photo).then(res => res.arrayBuffer())
            return Buffer.from(arrayBuffer)
          }
        }
        return
      },
      toURL: async () => {
        if (event?.chat.type == 'supergroup' || event?.chat.type == 'private') {
          const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
          if (typeof photo == 'string') {
            return photo
          }
        }
        return
      },
      toBase64: async () => {
        if (event?.chat.type == 'supergroup' || event?.chat.type == 'private') {
          const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
          if (typeof photo == 'string') {
            const arrayBuffer = await fetch(photo).then(res => res.arrayBuffer())
            return Buffer.from(arrayBuffer).toString('base64')
          }
        }
        return
      }
    }

    if (event?.chat.type == 'channel' || event?.chat.type == 'supergroup') {
      // 机器人消息不处理
      if (event?.from?.is_bot) return
      // 定义消
      const e = {
        // 事件类型
        Platform: platform,
        // 频道
        GuildId: String(event?.chat.id),
        ChannelId: String(event?.chat.id),
        // user
        UserId: UserId,
        UserKey: UserKey,
        UserName: event?.chat.username,
        UserAvatar: UserAvatar,
        IsMaster: false,
        IsBot: false,
        // message
        MessageId: String(event?.message_id),
        OpenId: String(event?.chat?.id),
        CreateAt: Date.now(),
        // other
        tag: 'txt',
        value: null
      }
      // 当访问的时候获取
      Object.defineProperty(e, 'value', {
        get() {
          return event
        }
      })
      //
      OnProcessor(e as any, 'message.create')
      //
    } else if (event?.chat.type == 'private') {
      // 定义消
      const e = {
        // 事件类型
        Platform: platform,
        // 用户Id
        UserId: String(event?.from.id),
        UserKey: UserKey,
        UserName: event?.from?.username,
        UserAvatar: UserAvatar,
        IsMaster: false,
        IsBot: false,
        // message
        MessageId: String(event?.message_id),
        MessageText: event?.text,
        OpenId: String(event?.chat?.id),
        CreateAt: Date.now(),
        // other
        tag: 'txt',
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
    }
  })

  client.on('new_chat_members', async event => {
    // 机器人消息不处理
    if (event?.from.is_bot) return

    const UserId = String(event?.from?.id)
    const UserKey = useUserHashKey({
      Platform: platform,
      UserId: UserId
    })

    const UserAvatar = {
      toBuffer: async () => {
        const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
        if (typeof photo == 'string') {
          const arrayBuffer = await fetch(photo).then(res => res.arrayBuffer())
          return Buffer.from(arrayBuffer)
        }
        return
      },
      toURL: async () => {
        const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
        if (typeof photo == 'string') {
          return photo
        }
        return
      },
      toBase64: async () => {
        const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
        if (typeof photo == 'string') {
          const arrayBuffer = await fetch(photo).then(res => res.arrayBuffer())
          return Buffer.from(arrayBuffer).toString('base64')
        }
        return
      }
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: platform,
      // guild
      GuildId: String(event?.chat.id),
      ChannelId: String(event?.chat.id),
      // GuildName: event?.chat.title,
      // user
      UserId: UserId,
      UserKey: UserKey,
      UserName: event?.chat.username,
      UserAvatar: UserAvatar,
      IsMaster: false,
      IsBot: false,
      // message
      MessageId: String(event?.message_id),
      MessageText: event?.text,
      OpenId: String(event?.chat?.id),
      CreateAt: Date.now(),
      // othder
      tag: 'txt',
      value: null
    }
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return event
      }
    })
    //
    OnProcessor(e, 'member.add')
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
          const e = event?.value
          if (content) {
            return Promise.all([content].map(item => client.sendMessage(e.chat.id, item)))
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return Promise.all(images.map(item => client.sendPhoto(e.chat.id, item)))
          }
          return Promise.all([])
        },
        mention: async () => {
          // const event: TelegramClient.Message = e.value
          return []
        }
      }
    }
  }
})
