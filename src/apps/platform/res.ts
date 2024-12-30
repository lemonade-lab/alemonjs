import { Text, useSend } from 'alemonjs'
import { platform } from '@alemonjs/kook'

const kookResponse = OnResponse(event => {
  // 使用.value获取原生数据
  const e = event.value
  console.log('e:', e)
}, 'message.create')

export default OnResponse((event, next) => {
  // 匹配规则
  if (!/^(#|\/)?platform$/.test(event.MessageText)) {
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
    Send(Text('该平台不支持此类消息'))
  }
}, 'message.create')
