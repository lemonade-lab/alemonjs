# [https://alemonjs.com/](https://alemonjs.com/)

聊天机器人开发框架

```sh
yarn add alemonjs @alemonjs/gui -W
```

- 启动

> src/index.ts

```ts
import { start } from 'alemonjs'
start('src/index.ts')
```

- 响应

> src/apps/res.ts

```ts
import { Text, useSend } from 'alemonjs'
export default OnResponse(event => {
  // 创建API
  const Send = useSend(event)
  // 执行
  Send(Text('hello'))
  // 事件类型
}, 'message.create')
```

[配置编辑器](./bin/README.md)
