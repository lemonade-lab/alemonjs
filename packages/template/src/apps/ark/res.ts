import { Ark, Text, useSend } from 'alemonjs'
import { useMode, platform } from '@alemonjs/qq-bot'
export const regular = /^(#|\/)?ark$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
const response = onResponse(selects, event => {
  const Send = useSend(event)
  const isMode = useMode(event)
  if (event.Platform === platform && isMode('group')) {
    Send(
      Ark.Card({
        decs: '你是谁',
        title: '收你来啦',
        prompt: '通知信息！！',
        metadecs: '阿柠檬2正式版发送',
        cover:
          'https://pub.idqqimg.com/pc/misc/files/20190820/2f4e70ae3355ece23d161cf5334d4fc1jzjfmtep.png',
        link: 'https://www.alemonjs.com',
        subtitle: '赞赞赞'
      }),
      Ark.BigCard({
        title: '收你来啦',
        prompt: '通知信息！！',
        cover:
          'https://pub.idqqimg.com/pc/misc/files/20190820/2f4e70ae3355ece23d161cf5334d4fc1jzjfmtep.png',
        link: 'https://www.alemonjs.com',
        subtitle: '赞赞赞'
      })
    )
  } else {
    Send(Text('暂未支持'))
  }
})
export default response
