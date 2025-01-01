export default OnResponse(
  (event, next) => {
    if (!/^(\/|#)cwd/.test(event.MessageText)) {
      next()
      return
    }
    // 允许同组消息继续
    return true
  },
  ['message.create', 'private.message.create']
)
