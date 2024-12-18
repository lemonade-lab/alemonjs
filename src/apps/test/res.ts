import { OnResponse, Text, useSend } from 'alemonjs'
export default OnResponse((e, next) => {
  if (!/^test/.test(e.MessageText)) {
    next()
    return
  }
  const Send = useSend(e)
  Send(Text('test'))
  // 逻辑处理。
}, 'message.create')
