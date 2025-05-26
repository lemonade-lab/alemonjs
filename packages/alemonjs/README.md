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
import { Text, useMessage } from 'alemonjs'
// 创建事件类型
export const selects = onSelects(['message.create'])
// 导出响应
export default onResponse(selects, event => {
  // 使用发送函数
  const [message] = useMessage(event)
  // 发送文本
  message.send(format(Text('Hello Word!')))
})
```
