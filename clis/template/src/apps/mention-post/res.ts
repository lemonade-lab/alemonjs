import { useSend, Text, Mention } from 'alemonjs'
export const regular = /^(#|\/)?mention$/

const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

export default onResponse(selects, event => {
  const Send = useSend(event)

  console.log('mention')
  // 发送多种类型的消息
  Send(Text('Hello '), Mention(event.UserId), Text(', How are things going?'))

  // @ 所有人
  // Send(Mention())

  // @ channel
  // Send(Mention(event.ChannelId, { belong: 'channel' }))
})
