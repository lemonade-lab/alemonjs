import { ConfigType, Text, OnProcessor } from 'alemonjs'
import { KOOKClient } from 'chat-space'
/**
 *
 * @param val
 */
export const login = (val: ConfigType) => {
  // 创建客户端
  const client = new KOOKClient({
    token: val.token
  })

  // 连接
  client.connect()

  // 监听消息
  client.on('MESSAGES_PUBLIC', event => {
    // 这里是消息处理
    OnProcessor(
      {
        // 用户ID
        UserId: event.author_id,
        // 格式化数据
        MsgId: event.msg_id,
        // 事件类型
        Platform: 'kook',
        // 用户消息
        Megs: [Text(event.content)],
        // 原始数据
        value: event
      },
      'message.create'
    )
  })

  // 发送错误时
  client.on('ERROR', msg => {
    console.error(msg)
  })
}
