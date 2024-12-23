import { useSend, Text, Mention, Image } from 'alemonjs'
import { readFileSync } from 'fs'
import url from '@src/assets/test.jpeg'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?hello$/.test(event.MessageText)) {
    next()
    return
  }

  const Send = useSend(event)

  // 发送多种类型的消息
  Send(Text('Hello'), Mention(event.UserId), Text(', How are things going?'))

  // @ 所有人
  // Send(Mention())

  // @ channel
  // Send(Mention(event.ChannelId, { belong: 'channel' }))

  // 发送本地图片文件
  const img = readFileSync(url)
  if (img) {
    Send(Image(img))
  } else {
    Send(Text('图片不存在'))
  }

  //
}, 'message.create')
