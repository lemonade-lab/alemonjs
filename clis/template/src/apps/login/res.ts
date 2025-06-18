import { Text, useMessage, useSubscribe } from 'alemonjs'
export const regular = /^(#|\/)?login$/
export const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
export default onResponse(selects, event => {
  const [message] = useMessage(event)
  const [subscribe] = useSubscribe(event, selects)

  message.send(format(Text('请输入密码'), Text('123456')))

  // 订阅 res 挂载之前的
  const sub = subscribe.mount(
    (event, next) => {
      // 创建
      const [message] = useMessage(event)
      // 获取文本
      const text = event.MessageText
      // 检查
      if (text === '123456') {
        message.send(format(Text('密码正确')))
        clearTimeout(timeout)
      } else if (text == '/close') {
        message.send(format(Text('取消登录')))
        clearTimeout(timeout)
      } else {
        message.send(format(Text('密码不正确')))
        // 继续
        next()
      }
    },
    ['UserId']
  )

  const timeout = setTimeout(() => {
    // 取消订阅
    subscribe.cancel(sub)
    // 发送消息
    message.send(format(Text('登录超时')))
  }, 1000 * 10)
})
