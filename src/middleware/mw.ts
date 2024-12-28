/**
 * uid 都是邮箱
 * 不再使用平台的uid。
 * 而user_key是平台的uid
 * 都不再使用。避免数据不再找回。
 */
export default OnMiddleware(
  async (e, next) => {
    next()
    return
  },
  ['message.create', 'private.message.create']
)
