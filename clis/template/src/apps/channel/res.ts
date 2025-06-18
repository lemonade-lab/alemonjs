import { Text, sendToChannel } from 'alemonjs'
export const regular = /^(#|\/)?channel$/
let id = null
const selects = onSelects('message.create')
export default onResponse(selects, event => {
  if (id) {
    clearInterval(id)
  }
  setInterval(async () => {
    const data = format(Text('Hello, this is a message from the channel'))
    sendToChannel(event.ChannelId, data)
  }, 1000)
})
