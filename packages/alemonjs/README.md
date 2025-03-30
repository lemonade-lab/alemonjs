# [https://alemonjs.com/](https://alemonjs.com/)

聊天机器人开发框架

```sh
yarn add alemonjs @alemonjs/gui -W
```

- 启动

> src/index.js

```js
import { start } from 'alemonjs'
start('src/index.js')
```

- 响应

> src/response/res.js

```js
import { createSelects, onResponse, Text, useSend } from 'alemonjs'
// 创建事件类型
export const selects = createSelects(['message.create'])
// 导出响应
export default onResponse(selects, event => {
  // 使用发送函数
  const send = useSend(event)
  // 发送文本
  send(Text('Hello Word!'))
})
```
