import { Text, useSends, useSubscribe } from 'alemonjs'
import Res from './obLogin'
export const regular = /^(#|\/)?login$/

const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

const select = onSelects('message.create')

export default onResponse(selects, event => {
  const [send] = useSends(event)

  send(format(Text('请输入密码'), Text('123456')))

  if (event.name === 'message.create') {
    const [_, observer] = useSubscribe(event, select)
    observer(Res.current, [
      // 观察条件，当前用户
      'UserId'
    ])
  }
})
