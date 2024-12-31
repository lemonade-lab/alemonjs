import { Text, useSend } from 'alemonjs'
export default OnMiddleware(
  async (e, next) => {
    // send
    const Send = useSend(e)
    // Send(Text(`维护更新中.请等待。`))

    console.log('e:', e)
    console.log('e.value:', e.value)

    next()
    return
  },
  ['message.create', 'private.message.create']
)
