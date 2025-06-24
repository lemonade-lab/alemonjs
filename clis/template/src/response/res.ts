import { Text, useMessage } from 'alemonjs'
export const regular = /^(#|\/)?hello$/
const selects = onSelects(['message.create', 'private.message.create'])
const response = onResponse(selects, event => {
  const [message] = useMessage(event)
  message.send(format(Text('hello word!')))
})
export default response
