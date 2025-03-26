import { BT, createSelects, useSend } from 'alemonjs'
export const regular = /^(#|\/)?button$/
const selects = createSelects(['message.create', 'private.message.create'])
const response = onResponse(selects, event => {
  const Send = useSend(event)
  // 发送一组按钮
  // Send(
  //     BT.group(
  //         BT.row(BT("登录", "/登录游戏"), BT("退出", "/退出游戏")),
  //         BT.row(BT("百度一下", "https://baidu.com", { isLink: true })),
  //         BT.row(BT("是否同意", { click: "/同意", confirm: "/同意", cancel: "/不同意" })),
  //         BT.row(BT("闭关", "/立即闭关", { autoEnter: true }))
  //     )
  // )
  Send(BT.template('102048339_1742790363'))
})
export default response
