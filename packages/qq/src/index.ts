import { defineBot, Text, OnProcessor, useParse, At } from 'alemonjs'
import { Client, segment } from 'icqq'
import { device, error, qrcode, slider } from './login'
export default defineBot((_, { qq: config }) => {
  const d = Number(config?.device)
  // 创建客户端
  const client = new Client({
    // 机器人配置
    sign_api_addr: config?.sign_api_addr,
    // 默认要扫码登录
    platform: isNaN(d) ? 3 : d,
    // 默认版本
    ver: config?.ver
  })
  const qq = Number(config.qq)
  // 连接
  client.login(qq, config.password)
  client.on('system.login.error', event => error(event))
  client.on('system.login.device', event => device(client, event))
  client.on('system.login.qrcode', () => qrcode(client))
  client.on('system.login.slider', event => slider(client, event, qq))
  // 登录
  client.on('system.online', async () => {
    console.log('ciqq 登录成功')
  })
  client.on('message.private', async _ => {
    // console.log('message.private 待完成', event)
  })
  // 监听消息
  client.on('message.group', async event => {
    // 主人
    const master_id = config?.master_id ?? []
    const user_id = String(event.sender.user_id)
    const group_id = String(event.group_id)
    const isMaster = master_id.includes(user_id)

    // e.group_avatar = `https://p.qlogo.cn/gh/${e.group_id}/${e.group_id}/640/`

    let msg = ''
    const ats = []
    for (const val of event.message) {
      switch (val.type) {
        case 'text': {
          msg = (val?.text || '')
            .replace(/^\s*[＃井#]+\s*/, '#')
            .replace(/^\s*[\\*※＊]+\s*/, '*')
            .trim()
          break
        }
        case 'at': {
          ats.push(val.qq)
          break
        }
      }
    }

    // 定义消
    const e = {
      // 事件类型
      Platform: 'kook',
      // 频道
      GuildId: group_id,
      // 子频道
      ChannelId: group_id,
      // 是否是主人
      IsMaster: isMaster,
      // 用户ID
      UserId: user_id,
      // 用户名
      UserName: event.sender.nickname,
      // 用户头像
      UserAvatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`,
      // 格式化数据
      MsgId: event.message_id,
      // 用户消息
      Megs: [Text(msg), ...ats.map(item => At(item))],
      // 用户openId
      OpenID: user_id,
      // 创建时间
      CreateAt: Date.now(),
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

  // const friend = client.fl.get(e.user_id)
  // if (!friend) return
  // await client
  // .pickUser(e.user_id)
  // .sendMsg(msg)

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          const content = useParse(val, 'Text')
          if (content) {
            return Promise.all(
              [content].map(item => client.pickGroup(event.ChannelId).sendMsg(item))
            )
          }
          const images = useParse(val, 'Image')
          if (images) {
            return Promise.all(
              images.map(async item => {
                return await client.pickGroup(event.ChannelId).sendMsg(segment.image(item))
              })
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
