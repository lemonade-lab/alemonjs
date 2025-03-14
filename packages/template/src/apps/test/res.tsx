import React from 'react'
import { createSelects } from 'alemonjs'
import { Text, useSend, ImageFile, ImageURL, Image, Mention } from 'alemonjs/jsx'
import url from '@src/asstes/alemonjs.png'
import { readFileSync } from 'fs'
export const regular = /^(#|\/)?jsx$/
const selects = createSelects(['message.create', 'private.message.create'])
export default onResponse(selects, [
  e => {
    const send = useSend(e)
    // 发送文本
    send(<Text>Hello Word !</Text>)
    // 发送本地图片文件
    send(<ImageFile src={url} />)
    // 发送网络图片
    send(
      <ImageURL
        src={
          'http://gips2.baidu.com/it/u=195724436,3554684702&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960'
        }
      />
    )
    // 发送Buffer 图片
    const img = readFileSync(url)
    send(<Image value={img} />)
    // 发送@消息
    send(<Mention value={e.UserId} />)
  }
])
