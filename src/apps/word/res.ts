import { OnResponse, Text, useSend } from 'alemonjs'
export default OnResponse((e, next) => {
  if (!/^word/.test(e.MessageText)) {
    next()
    return
  }
  const Send = useSend(e)
  Send(Text('word'))
  // 逻辑处理。
}, 'message.create')
