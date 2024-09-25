import { Text, Link, useSend } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    // 创建一个send
    const Send = useSend(event)
    // 发送消息
    Send(
      Text('你好呀'),
      // 加粗文本
      Text('hello', 'bold'),
      // link 文字
      Link('百度', 'https://www.baidu.com')
      // buffer 图片
      // 按钮比较复杂一些
    )
    //
    next()
  },
  'message.create',
  /^你好呀$/
)
