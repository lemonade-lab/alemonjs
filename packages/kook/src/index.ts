import {
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  getConfigValue,
  User,
  DataEnums,
  cbpPlatform,
  createResult,
  ResultCode
} from 'alemonjs'
import { KOOKClient } from './sdk/index'
import { readFileSync } from 'fs'
import { getMaster } from './config.js'
import { getBufferByURL } from 'alemonjs/utils'
export const platform = 'kook'

export * from './hook.js'
export { KOOKAPI as API } from './sdk/api.js'

export default () => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]

  // 创建客户端
  const client = new KOOKClient({
    token: config.token
  })

  // 连接
  client.connect()

  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  client.on('MESSAGES_DIRECT', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) return false

    // 创建私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    const url = avatar.substring(0, avatar.indexOf('?'))
    const UserAvatar = url

    const UserId = event.author_id

    const [isMaster, UserKey] = getMaster(UserId)

    // 定义消
    const e: PrivateEventMessageCreate = {
      name: 'private.message.create',
      // 事件类型
      Platform: platform,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: data?.code,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGES_PUBLIC',
      value: event
    }
    cbp.send(e)
  })

  // 监听消息
  client.on('MESSAGES_PUBLIC', async event => {
    // 过滤机器人
    if (event.extra?.author?.bot) return false

    // 创建私聊标记
    const data = await client.userChatCreate(event.extra.author.id).then(res => res?.data)

    // 头像
    const avatar = event.extra.author.avatar

    // 获取消息
    let msg = event.content

    /**
     * 艾特类型所得到的
     * 包括机器人在内
     */
    const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
    for (const item of mention_role_part) {
      msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim()
    }

    /**
     * 艾特用户所得到的
     */
    const mention_part = event.extra.kmarkdown?.mention_part ?? []
    for (const item of mention_part) {
      msg = msg.replace(`(met)${item.id}(met)`, '').trim()
    }

    const UserAvatar = avatar.substring(0, avatar.indexOf('?'))
    const UserId = event.author_id
    const [isMaster, UserKey] = getMaster(UserId)

    // 定义消
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      // 事件类型
      Platform: platform,
      //
      GuildId: event.extra.guild_id,
      ChannelId: event.target_id,
      SpaceId: event.target_id,
      // 用户Id
      UserId: UserId,
      UserKey,
      UserName: event.extra.author.username,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      IsBot: false,
      // message
      MessageId: event.msg_id,
      MessageText: msg,
      OpenId: data?.code,
      CreateAt: Date.now(),
      //
      tag: 'MESSAGES_PUBLIC',
      value: event
    }
    cbp.send(e)
  })

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendChannel = async (target_id: string, val: DataEnums[]) => {
    if (val.length < 0) return Promise.all([])
    const content = val
      .filter(item => item.type == 'Mention' || item.type == 'Text')
      .map(item => {
        if (item.type == 'Mention') {
          if (
            item.value == 'everyone' ||
            item.value == 'all' ||
            item.value == '' ||
            typeof item.value != 'string'
          ) {
            return `(met)all(met)`
          }
          if (item.options?.belong == 'user') {
            return `(met)${item.value}(met)`
          } else if (item.options?.belong == 'channel') {
            return `(chn)${item.value}(chn)`
          }
          return ''
        } else if (item.type == 'Text') {
          if (item.options?.style == 'block') {
            return `\`${item.value}\``
          } else if (item.options?.style == 'italic') {
            return `*${item.value}*`
          } else if (item.options?.style == 'bold') {
            return `**${item.value}**`
          } else if (item.options?.style == 'strikethrough') {
            return `~~${item.value}~~`
          } else if (item.options?.style == 'boldItalic') {
            return `***${item.value}***`
          }
          return item.value
        }
      })
      .join('')

    try {
      if (content) {
        const res = await client.createMessage({
          type: 9,
          target_id: target_id,
          content: content
        })
        return [createResult(ResultCode.Ok, 'client.createMessage', res)]
      }
      const images = val.filter(
        item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
      )
      if (images.length > 0) {
        let bufferData = null
        for (let i = 0; i < images.length; i++) {
          if (bufferData) break
          const item = images[i]
          if (item.type == 'Image') {
            bufferData = Buffer.from(item.value, 'base64')
          } else if (item.type == 'ImageURL') {
            bufferData = await getBufferByURL(item.value)
          } else if (item.type == 'ImageFile') {
            bufferData = readFileSync(item.value)
          }
        }
        if (!bufferData) return []
        // 上传图片
        const imageRes = await client.postImage(bufferData)
        if (!imageRes) return []
        const url = imageRes.data?.url
        if (!url) return []
        // 发送消息
        const res = await client.createMessage({
          type: 2,
          target_id: target_id,
          content: url
        })
        return [createResult(ResultCode.Ok, 'client.createMessage', res)]
      }
      return []
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.createMessage', error)]
    }
  }

  /**
   *
   * @param channel_id
   * @param val
   * @returns
   */
  const sendUser = async (open_id: string, val: DataEnums[]) => {
    if (val.length < 0) return []
    const content = val
      .filter(item => item.type == 'Mention' || item.type == 'Text')
      .map(item => {
        if (item.type == 'Mention') {
          if (
            item.value == 'everyone' ||
            item.value == 'all' ||
            item.value == '' ||
            typeof item.value != 'string'
          ) {
            return `(met)all(met)`
          }
          if (item.options?.belong == 'user') {
            return `(met)${item.value}(met)`
          } else if (item.options?.belong == 'channel') {
            return `(chn)${item.value}(chn)`
          }
          return ''
        } else if (item.type == 'Text') {
          if (item.options?.style == 'block') {
            return `\`${item.value}\``
          } else if (item.options?.style == 'italic') {
            return `*${item.value}*`
          } else if (item.options?.style == 'bold') {
            return `**${item.value}**`
          } else if (item.options?.style == 'strikethrough') {
            return `~~${item.value}~~`
          } else if (item.options?.style == 'boldItalic') {
            return `***${item.value}***`
          }
          return item.value
        }
      })
      .join('')
    try {
      if (content) {
        const res = await client.createDirectMessage({
          type: 9,
          chat_code: open_id,
          content: content
        })
        return [createResult(ResultCode.Ok, 'client.createDirectMessage', res)]
      }
      const images = val.filter(
        item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
      )
      if (images.length > 0) {
        let bufferData = null
        for (let i = 0; i < images.length; i++) {
          if (bufferData) break
          const item = images[i]
          if (item.type == 'Image') {
            bufferData = Buffer.from(item.value, 'base64')
          } else if (item.type == 'ImageURL') {
            bufferData = await getBufferByURL(item.value)
          } else if (item.type == 'ImageFile') {
            bufferData = readFileSync(item.value)
          }
        }
        if (!bufferData) return []
        // 上传图片
        const imageRes = await client.postImage(bufferData)
        if (!imageRes) return []
        const url = imageRes.data?.url
        if (!url) return []
        const res = await client.createDirectMessage({
          type: 2,
          chat_code: open_id,
          content: url
        })
        return [createResult(ResultCode.Ok, 'client.createDirectMessage', res)]
      }
      return []
    } catch (error) {
      return [createResult(ResultCode.Fail, 'client.createDirectMessage', error)]
    }
  }

  /**
   *
   * @param user_id
   * @param val
   * @returns
   */
  // const sendUserByUserId = async (user_id: string, val: DataEnums[]) => {
  //   if (val.length < 0) return []
  //   // 创建私聊标记
  //   const data = await client.userChatCreate(user_id).then(res => res?.data)
  //   const open_id = data?.code
  //   return await sendUser(open_id, val)
  // }

  const api = {
    active: {
      send: {
        channel: sendChannel,
        user: sendUser
      }
    },
    use: {
      send: async (event, val: DataEnums[]) => {
        if (val.length < 0) return []
        if (event.name == 'message.create') {
          return await sendChannel(event.ChannelId, val)
        } else if (event.name == 'private.message.create') {
          return await sendUser(event.OpenId, val)
        }
        return []
      },
      mention: async e => {
        const event = e.value
        const MessageMention: User[] = []
        const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
        for (const item of mention_role_part) {
          const UserId = item.role_id
          const [isMaster, UserKey] = getMaster(UserId)
          MessageMention.push({
            UserId: UserId,
            UserName: item.name,
            UserKey: UserKey,
            IsMaster: isMaster,
            IsBot: true
          })
        }
        const mention_part = event.extra.kmarkdown?.mention_part ?? []
        for (const item of mention_part) {
          const UserId = item.id
          const [isMaster, UserKey] = getMaster(UserId)
          MessageMention.push({
            UserId: UserId,
            UserName: item.username,
            UserKey: UserKey,
            IsMaster: isMaster,
            IsBot: false
          })
        }
        return MessageMention
      }
    }
  }

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      const res = await api.use.send(event, paramFormat)
      if (!res) {
        consume([createResult(ResultCode.Ok, '请求完成', null)])
        return
      }
      consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)))
    } else if (data.action === 'message.send.channel') {
      const channel_id = data.payload.ChannelId
      const val = data.payload.params.format
      const res = await api.active.send.channel(channel_id, val)
      if (!res) {
        consume([createResult(ResultCode.Ok, '请求完成', null)])
        return
      }
      consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)))
    } else if (data.action === 'message.send.user') {
      const user_id = data.payload.UserId
      const val = data.payload.params.format
      const res = await api.active.send.user(user_id, val)
      if (!res) {
        consume([createResult(ResultCode.Ok, '请求完成', null)])
        return
      }
      consume(res.map(item => createResult(ResultCode.Ok, '请求完成', item)))
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      const res = await api.use.mention(event)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })

  cbp.onapis(async (data, consume) => {
    const key = data.payload?.key
    if (client[key]) {
      // 如果 client 上有对应的 key，直接调用。
      const params = data.payload.params
      const res = await client[key](...params)
      consume([createResult(ResultCode.Ok, '请求完成', res)])
    }
  })
}
