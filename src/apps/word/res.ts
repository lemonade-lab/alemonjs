import { useSend, Text, Mention, Image } from 'alemonjs'
import { readFileSync } from 'fs'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?你好$/.test(event.MessageText)) {
    next()
    return
  }
  const Send = useSend(event)
  // 发送文本
  Send(Text('Hello World!'))
  // 发送 @ 提及
  Send(Mention('123456'))
  // 发送多种类型的消息
  Send(Text('Hello'), Mention('123456'), Text(', How are things going?'))

  // 发送本地图片文件
  const img = readFileSync('src/assets/img/test.jpg')
  if (img) {
    Send(Image(img))
  } else {
    Send(Text('图片不存在'))
  }

  //
}, 'message.create')
