import { platform as qqbot, API as qqbotAPI } from '@alemonjs/qq-bot'
import { useClient } from 'alemonjs'

const selects = onSelects(['message.create', 'message.reaction.add'])

export default onResponse(selects, async event => {
  if (event.Platform === qqbot) {
    // 拿到一个可使用的客户端
    const [client] = useClient(event, qqbotAPI)
    const res = await client.channels(event.value.channel_id)
  } else {
    //
  }
})
