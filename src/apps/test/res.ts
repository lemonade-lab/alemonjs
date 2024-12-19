import { useParse } from 'alemonjs'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?test$/.test(event.MessageText)) {
    next()
    return
  }

  const ats = useParse(event, 'At')
  if (!ats || ats.length === 0) {
    return // @ 提及为空
  }

  // 查找用户类型的 @ 提及，且不是 bot
  const UserID = ats.find(item => item.typing === 'user' && !item.bot)?.value
  if (!UserID) {
    return // 未找到用户ID
  }

  // 解析用户消息。 即 得到 event.MessageText
  const text = useParse(event, 'Text')
  if (!text) {
    return // 消息为空
  }

  console.log('被AT的用户ID:', UserID)
  console.log('消息内容:', text)

  // 处理被AT的用户...
}, 'message.create')
