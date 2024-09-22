import { Text, useParse, useSend } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    console.log(event, next)
    // 创建一个send
    const Send = useSend(event)

    console.log(event.Megs)

    const Ats = useParse(event.Megs, 'At')

    console.log(Ats)

    // 发送消息
    Send(Text('hello'))
    //
  },
  'message.create',
  /^你好$/
)
