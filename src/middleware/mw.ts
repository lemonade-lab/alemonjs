/**
 * uid 都是邮箱
 * 不再使用平台的uid。
 * 而user_key是平台的uid
 * 都不再使用。避免数据不再找回。
 */
export default OnMiddleware(
  async (e, next) => {
    // 下一个中间件
    next()
    // 下一个周期 - 订阅mount
    // next(true)
    // 下下个周期 - onResponse
    // next(true, true)
    // 下下下个周期 - 订阅mountAfter
    // next(true, true, true)
    return
  },
  ['message.create', 'private.message.create']
)
