import { createSelects } from 'alemonjs'
const selects = createSelects(['message.create', 'private.message.create'])
export default onMiddleware(selects, async (e, next) => {
  // send
  // const Send = useSend(e)
  // Send(Text(`维护更新中.请等待。`))

  // console.log('e:', e)
  // console.log('e.value:', e.value)
  // console.log('url', await e.UserAvatar.toURL())

  // const config = getConfigValue()
  // console.log('test', config)

  // 在中间件响应之前，观察该用户

  next()
})
