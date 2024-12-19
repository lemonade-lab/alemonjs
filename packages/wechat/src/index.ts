import { defineBot, Text, OnProcessor, useParse, getConfigValue } from 'alemonjs'
import { WechatyBuilder } from 'wechaty'
import { FileBox } from 'file-box'
import { writeFileSync } from 'fs'
import { WechatyInterface } from 'wechaty/impls'
import { getStaticPath } from './static'
import { createHash } from 'alemonjs'
export type Client = WechatyInterface
export const client: Client = global.client
export default defineBot(() => {
  const value = getConfigValue()
  const config = value.wechat
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
      const master_id = value?.wechat?.master_id ?? []

      let UserAvatar = undefined
      try {
        UserAvatar = {
          toBuffer: async () => {
            const contact = event.talker()
            const avatarStream = await contact.avatar()
            return avatarStream.toBuffer()
          },
          toURL: async () => {
            const contact = event.talker()
            const avatarStream = await contact.avatar()
            const buffer = await avatarStream.toBuffer()
            const dir = getStaticPath(Date.now() + '.jpg')
            writeFileSync(dir, buffer)
            return dir
          },
          toBase64: async () => {
            const contact = event.talker()
            const avatarStream = await contact.avatar()
            const buffer = await avatarStream.toBuffer()
            return buffer.toString('base64')
          }
        }
      } catch (e) {
        console.log(e)
      }

      // 文本消息
      const txt = event.payload.text
      const MessageId = event.payload.id
      const UserId = event.payload.talkerId

      const UserKey = createHash(`wechat:${UserId}`)

      if (event.payload?.roomId) {
        const roomId = event.payload?.roomId ?? ''
        // 定义消
        const e = {
          // 事件类型
          Platform: 'wechat',
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
          IsMaster: master_id.includes(UserKey),
          // 格式化数据
          MessageId: MessageId,
          MessageBody: [Text(txt)],
          MessageText: txt,
          OpenId: '',
          // 创建时间
          CreateAt: Date.now(),
          // 表情
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
        OnProcessor(e, 'message.create')
      } else {
        const OpenId = event.payload?.listenerId ?? ''
        // 定义消
        const e = {
          // 事件类型
          Platform: 'wechat',
          // 用户Id
          UserId: UserId,
          UserKey: UserKey,
          UserAvatar: UserAvatar,
          IsMaster: master_id.includes(UserKey),
          // message
          MessageId: MessageId,
          MessageBody: [Text(txt)],
          MessageText: txt,
          OpenId: OpenId,
          CreateAt: Date.now(),
          // 表情
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
        OnProcessor(e, 'private.message.create')
      }
    })
    .on('error', () => {})

  //
  bot.start()

  global.client = bot

  return {
    api: {
      use: {
        send: (e, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const event = e.value
          const content = useParse(
            {
              MessageBody: val
            },
            'Text'
          )
          if (content) {
            return Promise.all([content].map(item => event.say(item)))
          }
          const images = useParse(
            {
              MessageBody: val
            },
            'Image'
          )
          if (images) {
            return Promise.all(
              images.map(item => {
                const filePath = getStaticPath(Date.now() + '.png')
                writeFileSync(filePath, item, 'utf-8')
                const fileBox = FileBox.fromFile(filePath)
                return event.say(fileBox)
              })
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
