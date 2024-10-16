import { defineBot, Text, OnProcessor, useParse, getConfig } from 'alemonjs'
import { Client, segment } from 'icqq'
import { device, error, qrcode, slider } from './login'
import { Store } from './store'

export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.qq
  if (!config) return

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
  // 主人
  const master_id: string[] = config?.master_id ?? []

  // 连接
  client.login(qq, config.password)
  // 错误
  client.on('system.login.error', event => error(event))
  // 设备
  client.on('system.login.device', event => device(client, event))
  // 二维码
  client.on('system.login.qrcode', () => qrcode(client))
  // 滑块
  client.on('system.login.slider', event => slider(client, event, qq))

  const LocalStore = new Store()

  // 登录
  client.on('system.online', async () => {
    if (master_id[0]) {
      const val = LocalStore.getItem()
      const Now = Date.now()
      if (!val || !val.RunAt || Now > Now + 1000 * 60 * 24) {
        LocalStore.setItem({
          RunAt: Now
        })
        const UserId = Number(master_id[0])
        // 是否是好友
        const friend = client.fl.get(UserId)
        if (!friend) return
        // send
        client.pickUser(UserId).sendMsg('欢迎使用[ @AlemonJS/QQ ]')
      }
    }
  })

  // 监听消息
  client.on('message.group', async event => {
    const user_id = String(event.sender.user_id)
    const group_id = String(event.group_id)
    const isMaster = master_id.includes(user_id)
    let msg = ''
    const Ats = []
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
          if (val.qq == 'all') {
            // everyone
            Ats.push({
              type: 'At',
              value: 'everyone',
              typing: 'everyone',
              name: 'everyone',
              avatar: 'everyone',
              bot: false
            })
          } else {
            // user
            Ats.push({
              type: 'At',
              value: String(val.qq),
              typing: 'user',
              name: '',
              avatar: `https://q1.qlogo.cn/g?b=qq&s=0&nk=${val.qq}`,
              bot: val.qq == qq
            })
          }
          break
        }
      }
    }
    // 定义消
    const e = {
      // 事件类型
      Platform: 'qq',
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
      Megs: [Text(msg)].concat(Ats),
      // 用户openId
      OpenID: user_id,
      // 创建时间
      CreateAt: Date.now(),
      // 标记
      tag: 'message.group',
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
