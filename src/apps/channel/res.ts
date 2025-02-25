import { createSendDataFormat } from 'alemonjs'
import { Text } from 'alemonjs'
export const regular = /^(#|\/)?channel$/
export const name = 'core:channel'
import { sendToChannel } from 'alemonjs'
let id = null
export default OnResponse(event => {
  if (id) {
    clearInterval(id)
  }
  setInterval(async () => {
    const data = createSendDataFormat(Text('Hello, this is a message from the channel'))
    sendToChannel(event.ChannelId, data)
  }, 1000)
}, 'message.create')
