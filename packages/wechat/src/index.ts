import {
  defineBot,
  getConfigValue,
  User,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  onProcessor
} from 'alemonjs'
import { WechatyBuilder } from 'wechaty'
import { FileBox } from 'file-box'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { getPublicPath, getStaticPath } from './static'
import { useUserHashKey } from 'alemonjs'
import { MessageInterface, type WechatyInterface } from 'wechaty/impls'
export type Client = WechatyInterface
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
export const platform = 'wechat'
export default defineBot(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  const bot = WechatyBuilder.build({
    name: config?.name ?? 'alemonjs'
  })

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

      const UserAvatar = {
        toBuffer: async () => {
          const contact = event.talker()
          const avatarStream = await contact.avatar()
          const dir = getPublicPath(avatarStream.name)
          if (existsSync(dir)) {
            return readFileSync(dir)
          }
          const buffer = await avatarStream.toBuffer()
          writeFileSync(dir, buffer)
          return buffer
        },
        toURL: async () => {
          const contact = event.talker()
          const avatarStream = await contact.avatar()
          const dir = getPublicPath(avatarStream.name)
          if (existsSync(dir)) return dir
          const buffer = await avatarStream.toBuffer()
          writeFileSync(dir, buffer)
          return dir
        },
        toBase64: async () => {
          const contact = event.talker()
          const avatarStream = await contact.avatar()
          const dir = getPublicPath(avatarStream.name)
          if (existsSync(dir)) {
            return readFileSync(dir).toString('base64')
          }
          const buffer = await avatarStream.toBuffer()
          writeFileSync(dir, buffer)
          return buffer.toString('base64')
        }
      }

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
          value: null
        }
        // 当访问的时候获取
        Object.defineProperty(e, 'value', {
          get() {
            return event
          }
        })
        // 处理消息
        onProcessor('message.create', e, event)
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
          value: null
        }
        // 处理消息
        onProcessor('private.message.create', e, event)
      }
    })
    .on('error', () => {})

  //
  bot.start()

  global.client = bot

  return {
    platform: platform,
    api: {
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
                writeFileSync(filePath, item.value, 'utf-8')
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
  }
})
