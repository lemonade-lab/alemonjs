import { Image } from 'alemonjs'
import url from '@src/asstes/alemonjs.png'
import frontResponse from '@src/apps/userid'
export const regular = /^(#|\/)?image$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
const response = onResponse(selects, () => {
  console.log(regular)
  // 发送本地图片文件
  return {
    data: [Image.file(decodeURIComponent(url))]
  }
})
export default onResponse(selects, [frontResponse.current, response.current])
