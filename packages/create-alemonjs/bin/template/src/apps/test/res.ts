import { Text, useOberver, useParse, useSend } from 'alemonjs'
export default OnResponse(
  event => {
    // 创建一个send
    const Send = useSend(event)
    Send(Text('请输入密码'))
    // 监听当前用户的下一个消息
    const Observer = useOberver(event, 'message.create')
    // 监听当前用户的下一个消息
    Observer(
      (event, { next }) => {
        // 创建一个send
        const Send = useSend(event)
        // 发送消息
        const text = useParse(event.Megs, 'Text')
        // 判断密码是否正确
        if (text === '123456') {
          Send(Text('密码正确1'))
        } else {
          Send(Text('密码不正确1'))
          next()
        }
      },
      ['UserId']
    )
  },
  'message.create',
  /测试/
)
