import { useSend, Text, Image } from 'alemonjs'
import { readFileSync } from 'fs'
import url from '@src/assets/test.jpeg'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?image$/.test(event.MessageText)) {
    next()
    return
  }
  const Send = useSend(event)
  // 发送本地图片文件
  const img = readFileSync(url)
  if (img) {
    Send(Image(img))
  } else {
    Send(Text('图片不存在'))
  }
}, 'message.create')
