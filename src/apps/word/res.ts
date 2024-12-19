import { useSend, Text, At, Image } from 'alemonjs'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?你好$/.test(event.MessageText)) {
    next()
    return
  }
  const Send = useSend(event)

  // 发送文本
  Send(Text('Hello World!'))

  // 发送 @ 提及
  Send(At('123456'))

  // 发送多种类型的消息
  Send(Text('Hello '), At('123456'), Text(', How are things going?'))

  // 发送图片
  const img: Buffer | null = null
  if (img) {
    Send(Image(img))
  } else {
    Send(Text('图片不存在'))
  }

  // 发送本地图片文件
  Send(Image('src/assets/img/test.jpg', 'file'))
}, 'message.create')
