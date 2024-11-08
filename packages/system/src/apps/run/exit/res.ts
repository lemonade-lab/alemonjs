import { lock } from '@src/model/lock'
import { Text, useObserver, useParse, useSend } from 'alemonjs'
export default OnResponse(
  event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }
    if (lock.value) {
      Send(Text('正在调控，请勿重复进行...'))
      return
    }
    Send(Text('请再次发送，以确认关机'))
    const Observer = useObserver(event, 'message.create')
    Observer(
      e => {
        const text = useParse(e.Megs, 'Text')
        if (/^(#|\/)结束进程$/.test(text)) {
          process.exit()
        }
        const Send = useSend(event)
        Send(Text('已取消！'))
      },
      ['UserId']
    )
  },
  'message.create',
  /^(#|\/)结束进程$/
)
