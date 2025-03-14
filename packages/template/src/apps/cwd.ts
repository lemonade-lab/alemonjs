import { createSelects } from 'alemonjs'

const selects = createSelects(['message.create', 'private.message.create'])

export default onResponse(selects, (event, next) => {
  if (!/^(\/|#)cwd/.test(event.MessageText)) {
    next()
    return
  }
  // 允许同组消息继续
  return true
})
