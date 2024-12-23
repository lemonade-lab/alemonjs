import { useSend, Text, Mention } from 'alemonjs'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?mention$/.test(event.MessageText)) {
    next()
    return
  }

  const Send = useSend(event)

  // 发送多种类型的消息
  Send(Text('Hello '), Mention(event.UserId), Text(', How are things going?'))

  // @ 所有人
  // Send(Mention())

  // @ channel
  // Send(Mention(event.ChannelId, { belong: 'channel' }))
}, 'message.create')
