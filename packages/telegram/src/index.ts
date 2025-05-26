import {
  cbpPlatform,
  getConfigValue,
  PrivateEventMessageCreate,
  PublicEventMemberAdd,
  PublicEventMessageCreate,
  useUserHashKey
} from 'alemonjs'
import TelegramClient from 'node-telegram-bot-api'
export const platform = 'telegram'
export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  const client = new TelegramClient(config.token, {
    polling: true,
    baseApiUrl: config?.base_api_url ?? '',
    request: {
      url: config?.request_url ?? '',
      proxy: config?.proxy ?? ''
    }
  })
  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

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

    const UserAvatar = (await getUserProfilePhotosUrl(event?.from?.id)) as string

    if (event?.chat.type == 'channel' || event?.chat.type == 'supergroup') {
      // 机器人消息不处理
      if (event?.from?.is_bot) return
      // 定义消
      const e: PublicEventMessageCreate = {
        // 事件类型
        Platform: platform,
        name: 'message.create',
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
        MessageText: event?.text,
        OpenId: String(event?.chat?.id),
        CreateAt: Date.now(),
        // other
        tag: 'txt',
        value: event
      }
      // 发送消息
      cbp.send(e)

      //
    } else if (event?.chat.type == 'private') {
      // 定义消
      const e: PrivateEventMessageCreate = {
        name: 'private.message.create',
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
        value: event
      }
      cbp.send(e)
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

    const UserAvatar = (await getUserProfilePhotosUrl(event?.from?.id)) as string

    // 定义消
    const e: PublicEventMemberAdd = {
      naem: 'member.add',
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
      // MessageText: event?.text,
      // OpenId: String(event?.chat?.id),
      CreateAt: Date.now(),
      // othder
      tag: 'txt',
      value: event
    }
    cbp.send(e)
  })

  const api = {
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

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      const res = await api.use.send(event, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.channel') {
      // const channel_id = data.payload.ChannelId
      // const val = data.payload.params.format
      // const res = await api.active.send.channel(channel_id, val)
      // consume(res)
    } else if (data.action === 'message.send.user') {
      // const user_id = data.payload.UserId
      // const val = data.payload.params.format
      // const res = await api.active.send.user(user_id, val)
      // consume(res)
    } else if (data.action === 'mention.get') {
      // const event = data.payload.event
      // const res = await api.use.mention(event)
      // consume(res)
    }
  })
}
