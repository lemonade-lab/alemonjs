// 一组响应事件。共用一个 next。
// 用于自由插入前置逻辑
import { createSelects } from 'alemonjs'
const selects = createSelects(['message.create', 'private.message.create'])
export default onResponse(selects, event => {
  // 可以称之为局部中间件。
  event['user_id'] = event.UserId

  // 如果调用 next将直接走下一个响应事件

  // 默认都是私有的。
  // 不需要被其他模块使用。

  // 允许继承
  return true
})
