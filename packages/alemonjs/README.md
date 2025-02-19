# [https://alemonjs.com/](https://alemonjs.com/)

聊天机器人开发框架

```sh
yarn add alemonjs -W
```

- 启动

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
