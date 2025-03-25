import { createSelects, ImageFile } from 'alemonjs'
import url from '@src/asstes/alemonjs.png'
import frontResponse from '@src/apps/userid'
export const regular = /^(#|\/)?image$/
const selects = createSelects(['message.create', 'private.message.create'])
const response = onResponse(selects, () => {
  // 发送本地图片文件
  return {
    data: [ImageFile(url)]
  }
})
export default onResponse(selects, [frontResponse.current, response.current])
