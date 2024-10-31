import { Text, OnProcessor, defineBot } from 'alemonjs'
import * as readline from 'readline'
export default defineBot(config => {
  console.log('config', config)

  // 创建接口以读取输入
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  // 监听输入事件
  rl.on('line', (input: string) => {
    console.log('input', input)

    // 定义消
    const e = {
      // 事件类型
      Platform: 'readline',
      // 频道
      GuildId: 'test',
      // 子频道
      ChannelId: 'test',
      // 是否是主人
      IsMaster: false,
      // 用户ID
      UserId: 'test',
      // 用户名
      UserName: 'test',
      // 用户头像
      UserAvatar: 'test',
      // 格式化数据
      MsgId: 'test',
      // 用户消息
      Megs: [Text(input ?? '')],
      // 用户openId
      OpenID: 'test',
      // 创建时间
      CreateAt: Date.now(),
      //
      value: null
    }

    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return input
      }
    })

    // 处理消息
    OnProcessor(e, 'message.create')
  })

  // 提示用户输入内容
  console.log('请输入测试内容: ')

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          console.log(event)
          console.log(val)
          return Promise.all([])
        }
      }
    }
  }
})
