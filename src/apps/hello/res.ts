import { OnResponse, Text, useSend } from 'alemonjs'
export default OnResponse((e, next) => {
  if (!/^hello/.test(e.MessageText)) {
    next()
    return
  }
  const Send = useSend(e)
  Send(Text('hello'))
  // 逻辑处理。
}, 'message.create')
