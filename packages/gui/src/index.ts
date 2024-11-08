import { defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import { WebSocketServer } from 'ws'
import Koa from 'koa'
import KoaStatic from 'koa-static'
import Router from 'koa-router'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * @param port
 * @returns
 */
const createServer = (port: number) => {
  const app = new Koa()
  const router = new Router()
  router.post('/update/user', async ctx => {
    ctx.body = {
      code: 200
    }
  })
  const dir = join(process.cwd(), 'public')
  mkdirSync(join(dir, 'file'), { recursive: true })
  // 暴露public文件夹
  app.use(KoaStatic(dir))
  // routes
  app.use(router.routes())
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
    const e = {
      // 事件类型
      Platform: event.Platform,
      // 频道
      GuildId: event.GuildId,
      // 子频道
      ChannelId: event.ChannelId,
      // 是否是主人
      IsMaster: event.IsMaster,
      // 用户ID
      UserId: event.ChannelId,
      // 用户名
      UserName: event.UserName,
      // 用户头像
      UserAvatar: event.UserAvatar,
      // 格式化数据
      MsgId: event.MsgId,
      // 用户消息
      Megs: [Text(event)],
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
   * @param data
   * @returns
   */
  const SendData = (data: any) => {
    return client.send(JSON.stringify(data))
  }

  /**
   *
   * @param txt
   */
  const sendMessage = (txt: string) => {
    return SendData({
      t: 'send_message',
      d: [
        {
          t: 'text',
          d: txt
        }
      ]
    })
  }

  /**
   *
   * @param url
   */
  const sendImage = (url: string) => {
    return SendData({
      t: 'send_message',
      d: [
        {
          t: 'image',
          d: {
            url: url
          }
        }
      ]
    })
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
          const images = useParse(val, 'Image')
          if (images) {
            return Promise.all(
              images.map(async item => {
                const url = `/file/${Date.now()}.png`
                writeFileSync(join(process.cwd(), 'public', url), item, 'utf-8')
                return sendImage(url)
              })
            )
          }
          return Promise.all([])
        }
      }
    }
  }
})
