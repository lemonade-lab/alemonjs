import { Text, useMessage } from 'alemonjs'
export const selects = onSelects(['message.create'])
export default onResponse(selects, event => {
  // 创建
  const [message] = useMessage(event)
  message.send(format(Text('这个'), Text('标题', { style: 'bold' }), Text('被加粗了')))
  message.send(format(Text('这个'), Text('标题'), Text('没有变化')))
  message.send(
    format(
      Text(`// 我的代码块 \nconst Send = useSend(event)`, {
        style: 'block'
      })
    )
  )
})
