// 选择事件类型
export const selects = onSelects(['message.create'])
// 定义响应函数
export default onResponse(selects, (event, next) => {
  // 前往下一个响应,不执行则响应到此处后，立即停止。
  next()
})
