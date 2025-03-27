import { createSelects } from 'alemonjs'
import { client, platform, useMode } from '@alemonjs/qq-bot'
export const regular = /^(#|\/)?ark$/
const selects = createSelects(['message.create'])
const response = onResponse(selects, event => {
  const isMode = useMode(event)
  if (event.Platform == platform && isMode('group')) {
    // 群pai
    client.groupOpenMessages(event.GuildId, {
      msg_type: 3, // ark
      msg_id: event.MessageId, // msg_id
      msg_seq: client.getMessageSeq(event.MessageId),
      ark: {
        template_id: 24,
        kv: [
          {
            key: '#DESC#',
            value: '你是谁'
          },
          {
            key: '#PROMPT#',
            value: '通知信息！！'
          },
          {
            key: '#TITLE#',
            value: '收你来啦'
          },
          {
            key: '#METADESC#',
            value: '阿柠檬2正式版发送'
          },
          {
            key: '#IMG#',
            value:
              'https://pub.idqqimg.com/pc/misc/files/20190820/2f4e70ae3355ece23d161cf5334d4fc1jzjfmtep.png'
          },
          {
            key: '#LINK#',
            value: ''
          },
          {
            key: '#SUBTITLE#',
            value: '赞赞赞'
          }
        ]
      }
    })
  } else if (event.Platform == platform && isMode('guild')) {
    // 频道api
  }
})
export default response
