import { Text, useSend } from 'alemonjs'
import { platform } from '@alemonjs/kook'

const kookResponse = OnResponse(
  (event, next) => {
    // 使用.value获取原生数据
    const e = event.value
    console.log('e:', e)
    next()
  },
  ['message.create', 'private.message.create']
)

export const name = 'core:platfrom'

export const regular = /^(#|\/)?platform$/

export default OnResponse(
  (event, next) => {
    // 判断平台
    if (event.Platform == platform) {
      kookResponse.current(event, next)
    } else {
      // 创建
      const Send = useSend(event)
      // 发送文本消息
      Send(Text('该平台不支持此类消息'))
    }
  },
  ['message.create', 'private.message.create']
)
