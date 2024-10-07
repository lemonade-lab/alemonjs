# chat-space

连接 discord、kook、qqbot 开放平台的机器人

```sh
npm install chat-space
```

### Development

- Discord

```ts
import { DCClient } from 'chat-space'

// 创建客户端
const Client = new DCClient({
  token: ''
})

// 连接
Client.connect()

// 监听消息创建
Client.on('MESSAGE_CREATE', async e => {
  // 排除是bot用户的消息
  if (e.author?.bot) return
  // 在子频道回复消息
  Client.channelsMessages(e.channel_id, {
    content: `收到消息${e.content}`
  })
})

Client.on('ERROR', e => {
  if (e.message) {
    console.log('出现错误', e.message)
  } else {
    console.log('出现错误', e)
  }
})
```

### Community

QQ Group 806943302
