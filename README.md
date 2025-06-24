# ALemonJS

基于 javascript 所构建的，聊天机器人开发框架

```ts
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

## 平台支持情况

| Project                | Status                      | Description |
| ---------------------- | --------------------------- | ----------- |
| 👉[@alemonjs/gui]      | [![gui-s]][gui-p]           | 测试平台    |
| 👉[@alemonjs/qq-bot]   | [![qq-bot-s]][qq-bot-p]     | QQbot       |
| 👉[@alemonjs/discord]  | [![discord-s]][discord-p]   | discord     |
| 👉[@alemonjs/kook]     | [![kook-s]][kook-p]         | KOOK        |
| 👉[@alemonjs/telegram] | [![telegram-s]][telegram-p] | telegram    |
| 👉[@alemonjs/onebot]   | [![onebot-s]][onebot-p]     | onebot      |
| 👉[@alemonjs/wechat]   | [![wechat-s]][wechat-p]     | wechat      |

[alemonjs]: https://github.com/lemonade-lab/alemonjs
[a-s]: https://img.shields.io/npm/v/alemonjs.svg
[a-p]: https://www.npmjs.com/package/alemonjs
[@alemonjs/gui]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/gui
[gui-s]: https://img.shields.io/npm/v/@alemonjs/gui.svg
[gui-p]: https://www.npmjs.com/package/@alemonjs/gui
[@alemonjs/qq-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-bot
[qq-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-bot.svg
[qq-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-bot
[@alemonjs/discord]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/discord
[discord-s]: https://img.shields.io/npm/v/@alemonjs/discord.svg
[discord-p]: https://www.npmjs.com/package/@alemonjs/discord
[@alemonjs/kook]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/kook
[kook-s]: https://img.shields.io/npm/v/@alemonjs/kook.svg
[kook-p]: https://www.npmjs.com/package/@alemonjs/kook
[@alemonjs/telegram]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/telegram
[telegram-s]: https://img.shields.io/npm/v/@alemonjs/telegram.svg
[telegram-p]: https://www.npmjs.com/package/@alemonjs/telegram
[@alemonjs/qq]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq
[qq-s]: https://img.shields.io/npm/v/@alemonjs/qq.svg
[qq-p]: https://www.npmjs.com/package/@alemonjs/qq
[@alemonjs/onebot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/onebot
[onebot-s]: https://img.shields.io/npm/v/@alemonjs/onebot.svg
[onebot-p]: https://www.npmjs.com/package/@alemonjs/onebot
[@alemonjs/wechat]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/wechat
[wechat-s]: https://img.shields.io/npm/v/@alemonjs/wechat.svg
[wechat-p]: https://www.npmjs.com/package/@alemonjs/wechat

## 生态列表

| Project     | Status | Description                 |
| ----------- | ------ | --------------------------- |
| 👉[gui]     |        | VsCode 扩展：可视化测试环境 |
| 👉[dev]     |        | 开发环境                    |
| 👉[desktop] |        | 桌面版                      |
| 👉[web]     |        | WEB 一站式面板              |

[gui]: https://marketplace.visualstudio.com/items?itemName=lemonade-x.alemonjs-gui
[dev]: https://github.com/lemonade-lab/lvyjs
[desktop]: https://github.com/lemonade-lab/alemonjs-desktop
[web]: https://github.com/lemonade-lab/alemongo

## 贡献

<a href="https://github.com/lemonade-lab/docs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lemonade-lab/alemonjs" />
</a>

## 联系方式

> QQ Group 806943302
