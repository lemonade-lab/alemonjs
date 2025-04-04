import { Text, createSelects, useSend } from 'alemonjs'
import { platform } from '@alemonjs/kook'

const selects = createSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

const response = onResponse(selects, (event, next) => {
  // 使用.value获取原生数据
  const e = event.value
  console.log('e:', e)
  next()
})

export const regular = /^(#|\/)?platform$/

export default onResponse(selects, (event, next) => {
  // 判断平台
  if (event.Platform == platform) {
    response.current(event, next)
  } else {
    // 创建
    const Send = useSend(event)
    // 发送文本消息
    Send(Text('该平台不支持此类消息'))
  }
})
