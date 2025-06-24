import { BT, useMessage } from 'alemonjs'
const selects = onSelects(['message.create'])
const response = onResponse(selects, event => {
  const [message] = useMessage(event)

  // 一行多个
  message.send(format(BT.group(BT.row(BT('开始', '/开始游戏'), BT('结束', '/结束游戏')))))

  // 多行多个
  message.send(
    format(
      BT.group(
        BT.row(BT('开始', '/开始游戏'), BT('结束', '/结束游戏')),
        BT.row(BT('退出', '/退出游戏'), BT('注销', '/注销账户'))
      )
    )
  )

  // 更多类型
  message.send(
    format(
      BT.group(
        // link
        BT.row(
          BT('访问文档', 'https://alemonjs.com/', {
            type: 'link'
          })
        ),
        BT.row(
          BT('是否同意', '/同意', {
            type: 'call'
          })
        ),
        // 自动发送 + 显示字频道list + 禁用提示
        BT.row(
          BT('哈哈', '/哈哈', {
            autoEnter: false,
            showList: true,
            toolTip: '不支持'
          })
        )
      )
    )
  )

  // 使用申请好的模板（特定平台下使用）
  message.send(format(BT.template('template_id')))

  // 向申请的模板注入参数
  message.send(format(BT.template('template_id')))
})
export default response
