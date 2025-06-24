import { Text, useSends, useState } from 'alemonjs'
export const regular = /^(#|\/)?close:/
export const selects = onSelects(['message.create'])
export default onResponse(selects, (event, next) => {
  //   /close:login
  const name = event.MessageText.replace(regular, '')
  const [state, setState] = useState(name)
  if (state) {
    next()
    return
  }
  setState(false)
  const [send] = useSends(event)
  send(format(Text('关闭成功')))
  return
})
