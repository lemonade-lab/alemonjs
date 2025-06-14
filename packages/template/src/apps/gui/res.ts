import { BT, Text, useMessage } from 'alemonjs'
export const regular = /^(#|\/)?guibt$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
const response = onResponse(selects, event => {
  const [message] = useMessage(event)
  // 暂时仅支持qq，group发送按钮。更多支持待更新
  message.send(
    format(
      Text('控制板'),
      BT.group(
        BT.row(BT('image', '/image', { autoEnter: true }), BT('text', '/text'))
        // BT.row(BT('百度一下', 'https://baidu.com', { isLink: true })),
        // BT.row(BT('是否同意', { click: '/同意', confirm: '/同意', cancel: '/不同意' })),
        // BT.row(BT('闭关', '/立即闭关', { autoEnter: true }))
      )
    )
  )
})
export default response
