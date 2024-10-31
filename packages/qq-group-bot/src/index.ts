import { Text, OnProcessor, useParse, defineBot, getConfig } from 'alemonjs'
import { DrawingBed, QQBotGroupClient, FilesServer } from 'chat-space'
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.['qq-group-bot']
  if (!config) return

  // 创建客户端
  const client = new QQBotGroupClient({
    appID: config.app_id,
    secret: config.secret,
    token: config.token
  })
  // 创建文件服务
  const ClientFile = new FilesServer()
  // 连接
  client.connect()
  // 监听消息
  client.on('GROUP_AT_MESSAGE_CREATE', async event => {
    const master_id = config?.master_id ?? []
    const isMaster = master_id.includes(event.author.id)
    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq-group-bot',
      // 频道
      GuildId: event.group_id,
      // 子频道
      ChannelId: event.group_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户ID
      UserId: event.author.id,
      // 用户名
      UserName: '',
      // 用户头像
      UserAvatar: `https://q.qlogo.cn/qqapp/${config.app_id}/${event.author.id}/640`,
      // 格式化数据
      MsgId: event.id,
      // 用户消息
      Megs: [Text(event.content.trim())],
      // 用户openId
      OpenID: event.author.member_openid,
      // 创建时间
      CreateAt: Date.now(),
      tag: 'GROUP_AT_MESSAGE_CREATE',
      //
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
    // 如果状态为true
    if (DrawingBed.get('state')) {
      url = await DrawingBed.get('func')(msg)
    } else {
      url = await ClientFile.getFileUrl(msg)
    }
    if (!url) return Promise.resolve(null)
    return client
      .postRichMediaByGroup(GuildId, {
        srv_send_msg: false,
        file_type: 1,
        url
      })
      .then(res => res?.file_info)
  }

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = useParse(val, 'Text')
          if (content) {
            return Promise.all(
              [content].map(item =>
                client.groupOpenMessages(event.GuildId, {
                  content: item,
                  msg_id: event.MsgId,
                  msg_type: 0,
                  msg_seq: client.getMsgSeq(event.MsgId)
                })
              )
            )
          }
          const images = useParse(val, 'Image')
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
                  msg_id: event.MsgId,
                  msg_type: 7,
                  msg_seq: client.getMsgSeq(event.MsgId)
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
