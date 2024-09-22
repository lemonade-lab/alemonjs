# AlemonJS [https://alemonjs.com](https://alemonjs.com)

跨平台开发的事件驱动机器人

### Ecosystem

| Project      | Status                          | Description    |
| ------------ | ------------------------------- | -------------- |
| [alemonjs]   | [![alemonjs-s]][alemonjs-p]     | 标准应用解析器 |
| [chat-space] | [![chat-space-s]][chat-space-p] | 模板创建脚手架 |

[alemonjs]: https://github.com/ningmengchongshui/alemonjs
[alemonjs-s]: https://img.shields.io/npm/v/alemonjs.svg
[alemonjs-p]: https://www.npmjs.com/package/alemonjs
[chat-space]: https://github.com/ningmengchongshui/chat-space
[chat-space-s]: https://img.shields.io/npm/v/chat-space.svg
[chat-space-p]: https://www.npmjs.com/package/chat-space

## how to use

```ts
npm install yarn@1.19.1 -g
npm init -y
```

```sh
yarn add tsx -D
yarn add alemonjs@2 -W
yarna add @alemonjs/kook -W
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

> 启动 kook 依赖 @alemonjs/kook

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

- 自定义模块前缀

node_modules/@alemon/icqq

> 默认 @alemonjs/

```sh
npx tsx index.ts --prefix "@alemon/" --login "icqq"
```

## Community

QQ Group 806943302
