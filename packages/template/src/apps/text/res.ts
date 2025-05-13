import { Text, useSend } from 'alemonjs'
export const regular = /^(#|\/)?text$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
export default onResponse(selects, event => {
  // 创建
  const Send = useSend(event)
  Send(Text('这个'), Text('标题', { style: 'bold' }), Text('被加粗了'))
  Send(Text('这个'), Text('标题'), Text('没有变化'))
})
