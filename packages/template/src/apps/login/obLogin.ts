import { Text, useSend } from 'alemonjs'

const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

export default onResponse(selects, (event, next) => {
  // 创建
  const Send = useSend(event)
  // 获取文本
  const text = event.MessageText
  // 检查
  if (text === '123456') {
    Send(Text('密码正确'))
    // 结束
  } else if (text == '/close') {
    // 结束
    Send(Text('取消登录'))
  } else {
    Send(Text('密码不正确'))
    // 继续监听
    next()
  }
})
