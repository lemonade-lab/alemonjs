import {
  getConfigValue,
  User,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  cbpPlatform,
  createResult,
  ResultCode
} from 'alemonjs'
import { WechatyBuilder } from 'wechaty'
import { FileBox } from 'file-box'
import { readFileSync, writeFileSync } from 'fs'
import { getStaticPath } from './static'
import { useUserHashKey } from 'alemonjs'
import { MessageInterface } from 'wechaty/impls'
export const platform = 'wechat'
export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  const bot = WechatyBuilder.build({
    name: config?.name ?? 'alemonjs'
  })

  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  let i = 0
  bot
    .on('scan', (qrcode, status) => {
      console.log(
        [
          `扫描二维码登录: ${status}`,
          `${config?.qrcode_url ?? 'https://wechaty.js.org/qrcode/'}${encodeURIComponent(qrcode)}`
        ].join('\n')
      )
      if (i > 6) {
        bot.logout()
        // 长期不扫码
        process.cwd()
        return
      }
      i++
    })
    .on('login', user => {
      i = 0
      console.log(`用户 ${user} 成功登录`)
    })
    .on('logout', user => console.log(`用户 ${user} 退出登录`))
    .on('message', async event => {
      // 自己的消息
      if (event.self()) return
      // 过时消息
      if (event.age() > 2 * 60) {
        console.info('由于消息太旧（超过 2 分钟）而被丢弃)')
        return
      }
      // 14 消息卡片 6 图片 7 文字 13 撤回
      if (event.payload.type != 7) return

      //
      const value = getConfigValue()
      const master_key = value?.wechat?.master_key ?? []

      // 修复。如何获取用户头像 url。而不是先存储到本地。
      const contact = event.talker()
      const avatarStream = await contact.avatar()
      const UserAvatar = await avatarStream.toBase64()

      // 文本消息
      const txt = event.payload.text
      const MessageId = event.payload.id
      const UserId = event.payload.talkerId

      const UserKey = useUserHashKey({
        Platform: platform,
        UserId
      })

      if (event.payload?.roomId) {
        let msg = event.payload.text

        try {
          msg = await event.mentionText()
        } catch (e) {
          console.log(e)
        }

        const roomId = event.payload?.roomId ?? ''

        // 定义消
        const e: PublicEventMessageCreate = {
          name: 'message.create',
          // 事件类型
          Platform: platform,
          /**
           * guild
           */
          GuildId: roomId,
          ChannelId: roomId,
          /**
           * user
           */
          UserId: UserId,
          UserKey: UserKey,
          UserAvatar: UserAvatar,
          IsMaster: master_key.includes(UserKey),
          IsBot: false,
          // message
          MessageId: MessageId,
          MessageText: msg ?? '',
          OpenId: '',
          CreateAt: Date.now(),
          //
          tag: 'message',
          value: event
        }
        cbp.send(e)
      } else {
        const OpenId = event.payload?.listenerId ?? ''
        // 定义消
        const e: PrivateEventMessageCreate = {
          name: 'private.message.create',
          // 事件类型
          Platform: platform,
          // 用户Id
          UserId: UserId,
          UserKey: UserKey,
          UserAvatar: UserAvatar,
          IsMaster: master_key.includes(UserKey),
          IsBot: false,
          // message
          MessageId: MessageId,
          MessageText: txt ?? '',
          OpenId: OpenId,
          CreateAt: Date.now(),
          // 表情
          tag: 'message',
          value: event
        }
        cbp.send(e)
      }
    })
    .on('error', () => {})

  //
  bot.start()

  const api = {
    active: {
      send: {
        channel: () => {
          return Promise.all([])
        },
        user: () => {
          return Promise.all([])
        }
      }
    },
    use: {
      send: (e, val) => {
        if (val.length < 0) return Promise.all([])
        const event: MessageInterface = e.value
        const content = val
          .filter(item => item.type == 'Mention' || item.type == 'Text')
          .map(item => item.value)
          .join('')
        if (content && content != '') {
          return Promise.all([content].map(item => event.say(item)))
        }
        const images = val.filter(
          item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
        )
        if (images) {
          return Promise.all(
            images.map(item => {
              if (item.type == 'ImageFile') {
                const filePath = getStaticPath(Date.now() + '.png')
                const data = readFileSync(item.value)
                writeFileSync(filePath, data, 'utf-8')
                const fileBox = FileBox.fromFile(filePath)
                return event.say(fileBox)
              } else if (item.type == 'ImageURL') {
                const fileBox = FileBox.fromUrl(item.value)
                return event.say(fileBox)
              }
              const filePath = getStaticPath(Date.now() + '.png')
              writeFileSync(filePath, Buffer.from(item.value, 'base64'), 'utf-8')
              const fileBox = FileBox.fromFile(filePath)
              return event.say(fileBox)
            })
          )
        }
        return Promise.all([])
      },
      mention: async e => {
        const event: MessageInterface = e.value
        const list = await event.mentionList()
        const MessageMention: User[] = list.map(item => {
          const UserId = item.payload.id
          // const avatar = item.payload.avatar
          return {
            UserId: UserId,
            UserName: item.payload.name,
            IsBot: false,
            IsMaster: false,
            UserKey: useUserHashKey({
              Platform: platform,
              UserId: UserId
            })
          }
        })
        return MessageMention
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
      const event = data.payload.event
      const res = await api.use.mention(event)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })
}
