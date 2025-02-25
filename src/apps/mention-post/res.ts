import { useSend, Text, Mention } from 'alemonjs'
export const name = 'core:mention:post'
export const regular = /^(#|\/)?mention$/
export default OnResponse(
  event => {
    const Send = useSend(event)

    // 发送多种类型的消息
    Send(Text('Hello '), Mention(event.UserId), Text(', How are things going?'))

    // @ 所有人
    // Send(Mention())

    // @ channel
    // Send(Mention(event.ChannelId, { belong: 'channel' }))
  },
  ['message.create', 'private.message.create']
)
