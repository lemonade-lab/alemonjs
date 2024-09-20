import { OnResponse, Parse } from 'alemonjs'
export default OnResponse((event, res) => {
  // 用户编号
  const user_id = event.UserId
  // 消息编号
  const msg_id = event.MsgId
  // 尝试解析消息
  const text = Parse('Text', event.Megs)
  // 尝试解析图片
  const image = Parse('Img', event.Megs)
  // 判断当前平台
  const platform = event.Platform
  // 拿出原始数据
  const value = event.value
  //
}, 'message.create')
