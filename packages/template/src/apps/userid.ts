// 一组响应事件。共用一个 next。
// 用于自由插入前置逻辑
export default OnResponse(
  (event, next) => {
    // 可以称之为局部中间件。
    event['user_id'] = event.UserId

    // 如果调用 next将直接走下一个响应事件

    // 允许继承
    return true
  },
  ['message.create', 'private.message.create']
)
