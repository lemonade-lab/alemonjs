import { Text, OnProcessor, useParse, defineBot, getConfig, createHash } from 'alemonjs'
import { QQBotGroupClient } from './sdk'
export type Client = typeof QQBotGroupClient.prototype
export const client: Client = global.client
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.['qq-group-bot']
  if (!config) return

  // 创建客户端
  const client = new QQBotGroupClient({
    appId: config.app_id,
    secret: config.secret,
    token: config.token
  })
  // 连接
  client.connect()
  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)

    const url = `https://q.qlogo.cn/qqapp/${config.app_id}/${event.author.id}/640`
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
    const UserKey = createHash(`qq-group-bot:${event.author.id}`)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq-group-bot',
      // guild
      GuildId: event.group_id,
      ChannelId: event.group_id,
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      // 格式化数据
      MessageId: event.id,
      MessageBody: [Text(event.content.trim())],
      MessageText: event.content?.trim(),
      OpenId: event.author.member_openid,
      CreateAt: Date.now(),
      //
      tag: 'GROUP_AT_MESSAGE_CREATE',
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

  client.on('C2C_MESSAGE_CREATE', async event => {
    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)
    const url = `https://q.qlogo.cn/qqapp/${config.app_id}/${event.author.id}/640`
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
    const UserKey = createHash(`qq-group-bot:${event.author.id}`)
    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq-group-bot',
      // 用户Id
      UserId: event.author.id,
      UserKey,
      UserAvatar: UserAvatar,
      IsMaster: isMaster,
      // 格式化数据
      MessageId: event.id,
      MessageBody: [Text(event.content.trim())],
      MessageText: event.content?.trim(),
      CreateAt: Date.now(),
      //
      tag: 'GROUP_AT_MESSAGE_CREATE',
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

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })

  /**
   *
   * @param GuildId
   * @param msg
   * @returns
   */
  const getFileInfo = async (GuildId: string, msg: Buffer) => {
    let url = null
    return client
      .postRichMediaByGroup(GuildId, {
        file_type: 1,
        url,
        file_data: msg.toString('base64')
      })
      .then(res => res?.file_info)
  }

  global.client = client

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = useParse(
            {
              MessageBody: val
            },
            'Text'
          )
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.groupOpenMessages(event.GuildId, {
                  content: item,
                  msg_id: event.MessageId,
                  msg_type: 0,
                  msg_seq: client.getMessageSeq(event.MessageId)
                })
              )
            )
          }
          const images = useParse(
            {
              MessageBody: val
            },
            'Image'
          )
          if (images) {
            return Promise.all(
              images.map(async msg => {
                const file_info = await getFileInfo(event.GuildId, msg)
                if (!file_info) return Promise.resolve(null)
                return client.groupOpenMessages(event.GuildId, {
                  content: '',
                  media: {
                    file_info
                  },
                  msg_id: event.MessageId,
                  msg_type: 7,
                  msg_seq: client.getMessageSeq(event.MessageId)
                })
              })
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
