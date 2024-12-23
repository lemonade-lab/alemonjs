import { useMention } from 'alemonjs'
export default OnResponse(async (event, next) => {
  if (!/^(#|\/)?test$/.test(event.MessageText)) {
    next()
    return
  }

  const Mentions = await useMention(event)
  if (!Mentions || Mentions.length === 0) {
    return // @ 提及为空
  }

  // 查找用户类型的 @ 提及，且不是 bot
  const User = Mentions.find(item => !item.IsBot)
  if (!User) {
    return // 未找到用户Id
  }

  console.log('User:', User)

  // 使用${Platform}:${UserId}哈希所得，长度为11的字符串
  // 这是用户的唯一标识，可用作数据库表的主键
  // User.UserKey

  const text = event.MessageText
  if (!text || text == '') {
    return // 消息为空
  }

  console.log('text:', text)

  // 处理被AT的用户...
}, 'message.create')
