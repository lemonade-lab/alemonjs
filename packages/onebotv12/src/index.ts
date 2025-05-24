import { getConfigValue, onProcessor, PublicEventMessageCreate, useUserHashKey } from 'alemonjs'
import { OneBotClient } from './sdk/wss'

const MyBot = {
  id: '',
  name: '',
  avatar: ''
}

export const platform = 'onebot'

export const start = () => {
  ;() => {
    const value = getConfigValue()
    const config = value[platform]

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

      const UserId = String(event.user_id)
      const UserKey = useUserHashKey({
        Platform: platform,
        UserId
      })

      // 定义消
      const e: PublicEventMessageCreate = {
        // 平台类型
        Platform: platform,
        name: 'message.create',
        // 频道
        GuildId: event.group_id,
        // guild_name: event.group_name,
        // 子频道
        ChannelId: event.group_id,
        // uyser
        IsMaster: uis.includes(String(event.user_id)),
        UserId: UserId,
        IsBot: false,
        UserKey,
        UserName: event.sender.nickname,
        UserAvatar: UserAvatar,
        // message
        MessageId: event.message_id,
        MessageText: msg,
        OpenId: event.user_id,
        CreateAt: Date.now(),
        // ohther
        tag: 'MESSAGES',
        value: null
      }
      // 处理消息
      onProcessor('message.create', e, event)
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
                          file_id: item
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
  }
}
