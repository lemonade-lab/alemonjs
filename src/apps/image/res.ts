import { useSend } from 'alemonjs'
import { Text, Image } from 'alemonjs'
import { readFileSync } from 'fs'
import url from '@src/asstes/alemonjs.png'
import Res from '@src/apps/userid'
export const regular = /^(#|\/)?image$/
export const name = 'core:image'
export default OnResponse(
  [
    Res.current,
    event => {
      const Send = useSend(event)
      // 发送本地图片文件
      const img = readFileSync(url)
      if (img) {
        // Send(Image(img))
        Send(Text('图片不存在'), Image(img))
      } else {
        Send(Text('图片不存在'))
      }
    }
  ],
  ['message.create', 'private.message.create']
)
