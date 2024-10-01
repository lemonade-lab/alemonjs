import { Text, useSend } from 'alemonjs'
export default OnResponse(
  event => {
    // 创建一个send
    const Send = useSend(event)
    // 发送消息
    Send(Text('hello Word'))
  },
  'message.create',
  /^hello$/
)
