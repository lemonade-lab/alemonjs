import { OnResponse, Text, useSend } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    console.log(event, next)
    // 发送消息
    useSend(Text('hello'))
  },
  'message.create',
  /^你好$/
)
