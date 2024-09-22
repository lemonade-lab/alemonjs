import { useParse } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    // 用户编号
    const user_id = event.UserId
    // 消息编号
    const msg_id = event.MsgId
    // 尝试解析消息
    const text = useParse(event.Megs, 'Text')
    // 尝试解析图片
    const image = useParse(event.Megs, 'Image')
    // 判断当前平台
    const platform = event.Platform
    // 拿出原始数据
    const value = event.value
    //
  },
  'message.create',
  /测试/
)
