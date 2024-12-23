import { Button, ButtonBox, Text, useSend } from 'alemonjs'
export default OnResponse((event, next) => {
  if (!/^(#|\/)?text$/.test(event.MessageText)) {
    next()
    return
  }

  // 创建
  const Send = useSend(event)

  Send(Text('这个'), Text('标题', { style: 'bold' }), Text('被加粗了'))

  Send(Text('这个'), Text('标题'), Text('没有变化'))

  Send(
    Text(
      [
        `const Send = useSend(event)`,
        `Send(Text('这个'), Text('标题', { style: 'bold' }), Text('被加粗了'))`,
        `Send(Text('这个'), Text('标题'), Text('没有变化'))`
      ].join('\n'),
      {
        style: 'block'
      }
    )
  )

  Send(
    ButtonBox(
      [
        Button('同行按钮1', { color: 'blue' }),
        Button('同行按钮2', { color: 'blue' }),
        Button('同行按钮3', { color: 'blue' })
      ],
      {
        // default: 'flex-row'
        display: 'flex-row'
      }
    ),
    ButtonBox(
      [
        Button('占满按钮1', { color: 'blue' }),
        Button('占满按钮2', { color: 'blue' }),
        Button('占满按钮3', { color: 'blue' })
      ],
      {
        // 占满一行
        display: 'flex-col'
      }
    )
  )

  //
}, 'message.create')
