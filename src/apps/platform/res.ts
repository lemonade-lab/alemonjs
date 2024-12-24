import { client } from '@alemonjs/qq-group-bot'
export default OnResponse(
  (event, next) => {
    if (!/^(#|\/)?platform$/.test(event.MessageText)) {
      next()
      return
    }
    if (event.Platform == 'qq-group-bot') {
      const e = event.value
      // 原生接口
      client.groupOpenMessages(e.group_id, {
        //
      })
    } else {
      //
    }
  },
  ['message.create', 'private.message.create']
)
