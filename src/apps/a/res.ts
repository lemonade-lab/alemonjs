import {
  Img,
  OnResponse,
  Text,
  Link,
  useSend,
  At,
  Button,
  Files,
  Voice,
  Video,
  BtBox
} from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    // 创建一个send
    const Send = useSend(event)
    // 发送消息
    Send(
      // at 某人
      At('123456'),
      // at 所有人
      At(),
      // at 频道
      At('123', 'channel'),
      // at 服务器
      At('123', 'guild'),
      // 加粗文本
      Text('hello', 'bold'),
      // link 文字
      Link('百度', 'https://www.baidu.com'),
      // 网络图片
      Img('https://www.baidu.com', 'network'),
      // buffer 图片
      Img(Buffer.from('')),
      // 按钮比较复杂一些
      BtBox(
        // col 布局
        'Col',
        // 按钮
        Button('hello', { send: '/你好' }),
        //
        Button('hello', { send: '/你好', enter: true })
      ),
      BtBox('Row', Button('hello', { send: '/你好' }))
    )
    // 文件
    Send(Files('https://www.baidu.com'))
    // 视频
    Send(Voice('https://www.baidu.com'))
    // 音频
    Send(Video('https://www.baidu.com'))
  },
  'message.create',
  /^你好呀$/
)
