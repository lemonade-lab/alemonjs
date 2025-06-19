import { platform as qqbot, useClient } from '@alemonjs/qq-bot'

const selects = onSelects(['message.create'])

export default onResponse(selects, async event => {
  if (event.Platform === qqbot) {
    // [客户端，原生值]
    const [client, value] = useClient(event)

    const res = await client.channels(value.group_openid)
  }
})
