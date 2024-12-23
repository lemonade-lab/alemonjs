import { Text, useObserver, useSend } from 'alemonjs'

const Res = OnResponse((event, next) => {
  // 创建
  const Send = useSend(event)
  // 获取文本
  const text = event.MessageText
  // 检查
  if (text === '123456') {
    Send(Text('密码正确'))
    // 结束
  } else if (text == 'close') {
    // 结束
    Send(Text('取消登录'))
  } else {
    Send(Text('密码不正确'))
    // 继续监听
    next()
  }
}, 'message.create')

export default OnResponse((event, next) => {
  if (!/^(#|\/)?登录账号$/.test(event.MessageText)) {
    next()
    return
  }

  // 创建
  const Send = useSend(event)
  Send(Text('请输入密码'))

  // 创建观察者
  const Observer = useObserver(event, 'message.create')
  // 观察触发者的Id
  Observer(Res.current, ['UserId'])
}, 'message.create')
