import { useMention } from 'alemonjs'
export default OnResponse(async (event, next) => {
  if (!/^(#|\/)?test$/.test(event.MessageText)) {
    next()
    return
  }

  const ats = await useMention(event)
  if (!ats || ats.length === 0) {
    return // @ 提及为空
  }

  // 查找用户类型的 @ 提及，且不是 bot
  const UserId = ats.find(item => !item.IsBot)
  if (!UserId) {
    return // 未找到用户Id
  }

  const text = event.MessageText
  if (!text) {
    return // 消息为空
  }

  console.log('被AT的用户Id:', UserId)
  console.log('消息内容:', text)

  // 处理被AT的用户...
}, 'message.create')
