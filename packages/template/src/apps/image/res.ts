import { createSelects, useSend } from 'alemonjs'
import { Text, Image } from 'alemonjs'
import { readFileSync } from 'fs'
import url from '@src/asstes/alemonjs.png'
import frontResponse from '@src/apps/userid'
export const regular = /^(#|\/)?image$/

const selects = createSelects(['message.create', 'private.message.create'])

const response = onResponse(selects, event => {
  const Send = useSend(event)
  // 发送本地图片文件
  const img = readFileSync(url)
  if (img) {
    Send(Image(img))
  } else {
    Send(Text('图片不存在'))
  }
})

export default onResponse(selects, [frontResponse.current, response.current])
