import { defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import { WebSocketServer } from 'ws'
import Koa from 'koa'
import KoaStatic from 'koa-static'
// import Router from 'koa-router'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * @param port
 * @returns
 */
const createServer = (port: number) => {
  const app = new Koa()
  // const router = new Router()
  // router.post('/update/user', async ctx => {
  //   ctx.body = {
  //     code: 200
  //   }
  // })
  const dir = join(process.cwd(), 'public')
  mkdirSync(join(dir, 'file'), { recursive: true })
  // 暴露public文件夹
  app.use(KoaStatic(dir))
  // routes
  // app.use(router.routes())
  return app.listen(port, () => {
    console.log(`gui server start at port ${port}`)
  })
}

export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.gui
  if (!config) return
  const port = config?.port ?? 9601
  //
  const server = createServer(port)

  // 创建 WebSocketServer 并监听同一个端口
  const wss = new WebSocketServer({ server: server })

  //
  let client = null
  //
  const onMessage = event => {
    const txt = event.MsgBody.find((item: any) => item.t == 'text')
    const e = {
      // 事件类型
      Platform: event.Platform,
      // 频道
      GuildId: event.GuildId,
      // 子频道
      ChannelId: event.ChannelId,
      // 是否是主人
      IsMaster: event.IsMaster == 0 ? false : true,
      // 用户ID
      UserId: event.UserId,
      // 用户名
      UserName: event.UserName,
      // 用户头像
      UserAvatar: event.UserAvatar,
      // 格式化数据
      MsgId: event.MsgId,
      // 用户消息
      Megs: [Text(txt.d)],
      // 用户openId
      OpenID: event.OpenID,
      // 创建时间
      CreateAt: Date.now(),
      //
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
    //
    client = ws
    // 处理消息事件
    ws.on('message', (message: string) => {
      const event = JSON.parse(message)
      if (event.t == 'send_message') {
        onMessage(event.d)
      } else if (event.t == 'send_private_message') {
        // onMessage(event.d)
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
   * @param data
   * @returns
   */
  const SendData = (data: any) => client.send(JSON.stringify(data))

  //
  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          console.log(event)
          const content = useParse(val, 'Text')
          if (content) {
            return Promise.all(
              [content].map(item =>
                SendData({
                  t: 'send_message',
                  d: {
                    MsgBody: [
                      {
                        t: 'text',
                        d: item
                      }
                    ]
                  }
                })
              )
            )
          }
          const images = useParse(val, 'Image')
          if (images) {
            return Promise.all(
              images.map(async item => {
                const url = `/file/${Date.now()}.png`
                writeFileSync(join(process.cwd(), 'public', url), item, 'utf-8')
                return SendData({
                  t: 'send_message',
                  d: {
                    MsgBody: [
                      {
                        t: 'image',
                        d: {
                          url: url
                        }
                      }
                    ]
                  }
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
