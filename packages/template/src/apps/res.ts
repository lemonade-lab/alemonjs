import { createSelects, Text, useSend, useState } from 'alemonjs'
const open = /^(#|\/)?open:/
const close = /^(#|\/)?close:/

// 使用方法合并成一个
export const regular = new RegExp(open.source + '|' + close.source)

const selects = createSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

export default onResponse(selects, (event, next) => {
  const name = event.MessageText.replace(regular, '')
  const [state, setState] = useState(name)
  const Send = useSend(event)
  if (open.test(event.MessageText)) {
    if (state) {
      next()
      return
    }
    setState(true)
    Send(Text('启用成功'))
  } else if (close.test(event.MessageText)) {
    if (!state) {
      next()
      return
    }
    setState(false)
    Send(Text('关闭成功'))
  }
  next()
  return
})
