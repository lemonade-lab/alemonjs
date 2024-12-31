import { useSend } from 'alemonjs'
import { Text, Image } from 'alemonjs'
import { readFileSync } from 'fs'
import url from '@src/asstes/alemonjs.png'
export default OnResponse(
  (event, next) => {
    const text = event.MessageText
    if (!/^(#|\/)?image$/.test(text)) {
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
  },
  ['message.create', 'private.message.create']
)
