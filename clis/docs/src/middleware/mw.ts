export const selects = onSelects(['message.create'])
// 仅限 # 和 / 开头的消息才执行该中间件
// export const regular = /^(#|\/)/
export default onMiddleware(selects, (event, next) => {
  // 新增字段
  event['user_id'] = event.UserId

  // 常用于兼容其他框架或增强event功能
  next()
})
