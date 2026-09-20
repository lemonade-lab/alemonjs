# 安装与快速开始

[返回 README](./README.md) · [框架开发指南](./FRAMEWORK.md)

## 安装

```sh
yarn add @alemonjs/qq-bot
# 或
npm install @alemonjs/qq-bot
```

---

## 快速开始

1. 在 [QQ 开放平台](https://q.qq.com/) 创建机器人，获取 `AppID` 与 `AppSecret`。

> 不想手动获取密钥？启动适配器时未配置 `app_id`/`secret` 会自动进入扫码登录流程，详见 [扫码登录](./QR_LOGIN.md#扫码登录)。

2. 在项目 `alemon.config.yaml` 中配置：

```yaml
qq-bot:
  # 应用编号（必填）
  app_id: 'YOUR_APP_ID'
  # 应用密钥（必填）
  secret: 'YOUR_APP_SECRET'
```

3. 编写第一个响应（标准工程结构：`src/index.ts` 注册路由，`src/response/*.ts` 一个能力一个文件）：

```ts
// src/index.ts
import { Router, defineChildren } from 'alemonjs';

const router = Router.create({
  events: ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create']
});

// 命令分组：支持 /、#、! 前缀，也允许裸命令
const appGroup = router.group({
  routeText: {
    prefixes: ['/', '#', '!'],
    stripPrefix: true,
    allowBare: true
  }
});

// 注册命令：消息文本精确匹配“你好”
appGroup.use('你好', () => import('./response/hello'));

export default defineChildren({
  register() {
    return {
      responseRouter: router.define
    };
  }
});
```

```ts
// src/response/hello.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText('你好呀 👋') });
};
```

> 更复杂的调用（调用群 API / 主动发送）见 [调用方式](./API.md#调用方式)。handler 内通过 `useEvent` / `useRoute` / `useMessage` 等 Hook 读取当前事件上下文，命令匹配交给 Router DSL，不在 handler 里重复判断命令名。
