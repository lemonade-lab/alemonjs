# [https://alemonjs.com/](https://alemonjs.com/)

聊天机器人开发框架

```ts
import { Text, useSend } from 'alemonjs'
export default OnResponse((event, next) => {
  // 创建API
  const Send = useSend(event)
  // 执行
  Send(Text('hello'))
  // 下一个
  next()
  // 事件类型
}, 'message.create')
```

> VSCode 插件 [alemonjs-gui](https://marketplace.visualstudio.com/items?itemName=lemonade-x.alemonjs-gui)

> QQ Group 806943302

| Project                    | Status                              | Description    |
| -------------------------- | ----------------------------------- | -------------- |
| 👉[alemonjs]               | [![a-s]][a-p]                       | 核心库         |
| 👉[@alemonjs/gui]          | [![gui-s]][gui-p]                   | gui            |
| 👉[@alemonjs/qq-bot]       | [![qq-bot-s]][qq-bot-p]             | QQ webhook     |
| 👉[@alemonjs/qq-group-bot] | [![qq-group-bot-s]][qq-group-bot-p] | QQ group       |
| 👉[@alemonjs/qq-guild-bot] | [![qq-guild-bot-s]][qq-guild-bot-p] | QQ guild       |
| 👉[@alemonjs/qq]           | [![qq-s]][qq-p]                     | QQ 连接        |
| 👉[@alemonjs/discord]      | [![discord-s]][discord-p]           | DC 公会        |
| 👉[@alemonjs/kook]         | [![kook-s]][kook-p]                 | KOOK           |
| 👉[@alemonjs/telegram]     | [![telegram-s]][telegram-p]         | telegram       |
| 👉[@alemonjs/onebot]       | [![onebot-s]][onebot-p]             | onebot V11&V12 |
| 👉[@alemonjs/wechat]       | [![wechat-s]][wechat-p]             | 微信           |

[alemonjs]: https://github.com/lemonade-lab/alemonjs
[a-s]: https://img.shields.io/npm/v/alemonjs.svg
[a-p]: https://www.npmjs.com/package/alemonjs
[@alemonjs/gui]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/gui
[gui-s]: https://img.shields.io/npm/v/@alemonjs/gui.svg
[gui-p]: https://www.npmjs.com/package/@alemonjs/gui
[@alemonjs/qq-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-bot
[qq-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-bot.svg
[qq-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-bot
[@alemonjs/qq-group-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-group-bot
[qq-group-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-group-bot.svg
[qq-group-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-group-bot
[@alemonjs/qq-guild-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-guild-bot
[qq-guild-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-guild-bot.svg
[qq-guild-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-guild-bot
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
