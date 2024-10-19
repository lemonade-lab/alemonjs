import { defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import { WebSocketServer } from 'ws'
export default defineBot(() => {
  const cfg = getConfig()
  //
  const config = cfg.value?.gui
  //
  if (!config) return
  //
  const wss = new WebSocketServer({ port: config?.port ?? 9601 })
  //
  let client = null
  //
  const onMessage = event => {
    const e = {
      // 事件类型
      Platform: 'gui',
      // 频道
      GuildId: 'text',
      // 子频道
      ChannelId: 'text',
      // 是否是主人
      IsMaster: false,
      // 用户ID
      UserId: 'text',
      // 用户名
      UserName: 'text',
      // 用户头像
      UserAvatar: 'text',
      // 格式化数据
      MsgId: 'text',
      // 用户消息
      Megs: [Text(event)],
      // 用户openId
      OpenID: '',
      // 创建时间
      CreateAt: Date.now(),
      tag: 'MESSAGE_CREATE',
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
  }

  /**
   *
   */
  wss.on('connection', ws => {
    console.log('gui connection')
    client = ws
    // 处理消息事件
    ws.on('message', (message: string) => {
      const event = JSON.parse(message)
      if (event.t == 'send_message') {
        const txt = event.d.find((item: any) => item.t == 'text')
        onMessage(txt.d)
      } else {
        console.log('未知消息', event)
      }
    })
    // 处理关闭事件
    ws.on('close', () => {
      console.log('gui close')
    })
  })

  /**
   *
   * @param txt
   */
  const sendMessage = (txt: string) => {
    client.send(
      JSON.stringify({
        t: 'send_message',
        d: [
          {
            t: 'text',
            d: txt
          }
        ]
      })
    )
  }

  /**
   *
   */
  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          console.log(event)
          const content = useParse(val, 'Text')
          if (content) {
            return Promise.all([content].map(item => sendMessage(item)))
          }
          return Promise.all([])
        }
      }
    }
  }
})
