import { Text, useObserver, createSelects, useSend } from 'alemonjs'
import Res from './obLogin'
export const regular = /^(#|\/)?login$/

const selects = createSelects(['message.create', 'private.message.create'])

export default onResponse(selects, event => {
  // 创建
  const Send = useSend(event)
  Send(Text('请输入密码'))

  // 创建观察者
  const Observer = useObserver(event, 'message.create')
  Observer(Res.current, [
    // 观察条件，当前用户
    'UserId'
  ])
})
