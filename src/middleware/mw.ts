import { OnMiddleware } from 'alemonjs'
export default OnMiddleware((event, next) => {
  // 扩展 event
  event['user_id'] = event.UserKey
  // 下一个
  next()
}, 'message.create')
