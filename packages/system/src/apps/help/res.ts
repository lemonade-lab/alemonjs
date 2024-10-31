import { screenshotRender } from '@src/image'
import { Image, Text, useSend } from 'alemonjs'
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }
    const img = await screenshotRender()
    if (img) {
      Send(Image(img))
    } else {
      Send(Text('出错啦～'))
    }
  },
  'message.create',
  /^(#|\/)?系统帮助$/
)
