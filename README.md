# [https://lemonade-lab.github.io/alemonjs.com/](https://lemonade-lab.github.io/alemonjs.com/)

跨平台开发的事件驱动机器人

### Ecosystem

| Project                  | Status                              | Description       |
| ------------------------ | ----------------------------------- | ----------------- |
| [alemonjs]               | [![alemonjs-s]][alemonjs-p]         | 标准应用解析器    |
| [chat-space]             | [![chat-space-s]][chat-space-p]     | 接口 SDK          |
| [@alemonjs/kook]         | [![kook-s]][kook-p]                 | KOOK 机器人连接   |
| [@alemonjs/discord]      | [![discord-s]][discord-p]           | DC 公会机器人连接 |
| [@alemonjs/qq-group-bot] | [![qq-group-bot-s]][qq-group-bot-p] | QQ 群机器人连接   |
| [@alemonjs/qq-guild-bot] | [![qq-guild-bot-s]][qq-guild-bot-p] | QQ 频道机器人连接 |

[alemonjs]: https://github.com/ningmengchongshui/alemonjs
[alemonjs-s]: https://img.shields.io/npm/v/alemonjs.svg
[alemonjs-p]: https://www.npmjs.com/package/alemonjs
[chat-space]: https://github.com/ningmengchongshui/chat-space
[chat-space-s]: https://img.shields.io/npm/v/chat-space.svg
[chat-space-p]: https://www.npmjs.com/package/chat-space
[@alemonjs/kook]: https://github.com/alemonjs/kook
[kook-s]: https://img.shields.io/npm/v/@alemonjs/kook.svg
[kook-p]: https://www.npmjs.com/package/@alemonjs/kook
[@alemonjs/discord]: https://github.com/alemonjs/discord
[discord-s]: https://img.shields.io/npm/v/@alemonjs/discord.svg
[discord-p]: https://www.npmjs.com/package/@alemonjs/discord
[@alemonjs/qq-group-bot]: https://github.com/alemonjs/qq-group-bot
[qq-group-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-group-bot.svg
[qq-group-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-group-bot
[@alemonjs/qq-guild-bot]: https://github.com/alemonjs/qq-guild-bot
[qq-guild-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-guild-bot.svg
[qq-guild-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-guild-bot

## How to use

```ts
npm install yarn@1.19.1 -g
npm init -y
```

```sh
yarn add tsx -D
yarn add alemonjs@2 -W
```

- tsconfig.json

```ts
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "extends": "alemonjs/tsconfig.json"
}
```

- src/apps/hello/res.ts

```ts
import { Text, useSend } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    // 创建一个send
    const Send = useSend(event)
    // 发送消息
    Send(Text('hello'))
    //
  },
  'message.create',
  /^你好$/
)
```

- index.ts

```ts
import { createBot } from 'alemonjs'
createBot()
```

```sh
yarn add @alemonjs/kook -W
```

> 启动 kook 平台

```sh
npx tsx index.ts --login "kook"
```

> 设置 token

```sh
npx tsx index.ts --token "xxxx"
```

- alemon.config.yaml

> 默认监听的配置

```yaml
# 选择登录的机器人
login: ''

# 机器人配置
kook:
  # 令牌
  token: 'xxxx'
  # 主人
  master_id: []
```

## Community

QQ Group 806943302
