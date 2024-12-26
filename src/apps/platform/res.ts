import { Mention, Text, useSend } from 'alemonjs'
import { client, platform } from '@alemonjs/kook'

const kookResponse = OnResponse((event, next) => {
  // 使用.value获取原生数据
  const e = event.value

  //   client.postMessage ....
}, 'message.create')

export default OnResponse((event, next) => {
  // 匹配规则
  if (!/^(#|\/)?hello$/.test(event.MessageText)) {
    // 前往下一个响应
    next()
    return
  }
  // 判断平台
  if (event.Platform == platform) {
    kookResponse.current(event, next)
  } else {
    // 创建
    const Send = useSend(event)
    // 发送文本消息
    Send(Text('Hello Word'), Mention(event.UserId), Mention())
  }
}, 'message.create')
