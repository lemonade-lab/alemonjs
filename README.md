# ALemonJS

<p align="center">
  <a href="https://alemonjs.com">Website</a>
  ·
  <a href="./README.en.md">English</a>
  ·
  <a href="https://www.npmjs.com/package/alemonjs">npm</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/alemonjs">
    <img src="https://img.shields.io/npm/v/alemonjs.svg" alt="npm version">
  </a>
  <a href="https://github.com/lemonade-lab/alemonjs/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/alemonjs.svg" alt="license">
  </a>
</p>

ALemonJS 是一个面向跨平台聊天机器人的 Node.js 框架。  
它把事件处理、声明式路由、Hook、消息格式化与多通道通信协议整合在一起，让同一套业务代码可以运行在 QQ、Discord、KOOK、Telegram、OneBot 等平台。

## Why ALemonJS

- 跨平台优先：统一事件模型与消息能力，减少平台差异带来的业务分叉
- 架构完整：内置应用层、运行时核心、平台适配层，适合从小型机器人到多模块项目
- 通信灵活：支持 Direct Channel、IPC Bridge、WebSocket 三种通信路径
- 路由与生命周期清晰：支持声明式路由、模块生命周期、按需加载与插件化组织
- 面向工程：monorepo 管理、平台包拆分、桌面与服务端生态并行发展

## Quick Start

```bash
npm create alemonjs@latest
cd alemonjs
yarn install
yarn dev
```

官网文档：<https://alemonjs.com>

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        Application Layer                     │
│   Hooks · Router · Format · Response · Middleware           │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ CBP (Cross-platform Protocol)
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                         ALemonJS Core                        │
│   Event Processor · Runtime Store · Module Loader           │
│   Direct Channel · IPC Bridge · WebSocket                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                       Platform Adapters                      │
│   Discord · QQ Bot · OneBot · KOOK · Telegram · Bubble     │
└──────────────────────────────────────────────────────────────┘
```

## Core Capabilities

### Event-Driven Runtime

- 基于 `selects + handler` 的事件处理模型
- 覆盖消息、交互、成员、请求等多类事件
- 支持 middleware、subscribe、response、router 的组合处理

### Declarative Router

- 支持前缀匹配、精确匹配、嵌套路由与懒加载
- 适合命令型机器人、菜单型交互和模块化业务组织

```ts
import { defineChildren, Router } from 'alemonjs';

const router = Router.create({
  events: ['message.create', 'private.message.create']
});

const app = router.group(
  {
    routeText: {
      prefixes: ['/', '#', '＃', '!', '！'],
      stripPrefix: true,
      allowBare: true
    },
    keyPolicy: {
      maxWords: 2
    }
  },
  () => import('@src/response/mw')
);

app.use(['帮助'], () => import('@src/response/help'));

export default defineChildren({
  async register() {
    return {
      responseRouter: app.define
    };
  }
});
```

### Hook System

| Hook                                     | 用途                                  |
| ---------------------------------------- | ------------------------------------- |
| `useMessage`                             | 发送文本、图片、按钮、Markdown 等消息 |
| `useMention`                             | 获取 @ 提及用户                       |
| `useSubscribe`                           | 处理跨阶段订阅与等待回复              |
| `useChannel` / `useGuild` / `useMember`  | 频道、群组、成员相关操作              |
| `usePermission` / `useRole` / `useUser`  | 权限、角色、用户能力                  |
| `useHistory` / `useMedia` / `useRequest` | 历史消息、媒体、请求处理              |
| `useClient` / `useMe` / `useEvent`       | 客户端、当前机器人、事件上下文        |

### Message Formatting

```ts
import { Format, useEvent, useMessage } from 'alemonjs';

export default () => {
  const [event, next] = useEvent({
    selects: ['message.create', 'private.message.create']
  });

  if (!event.match.selects) {
    next();
    return;
  }

  const [message] = useMessage();
  const format = Format.create();

  format.addText('Hello!');
  format.addImage('https://alemonjs.com/me.png');
  format.addButtonGroup(Format.createButtonGroup().addRow().addButton('确认', { action: 'confirm' }));

  message.send({ format });
};
```

支持文本、图片、按钮组、Markdown、@提及、链接、附件、音视频等消息结构。

## Packages

### Platform Adapters

| Package                                                                  | Description |
| ------------------------------------------------------------------------ | ----------- |
| [`@alemonjs/qq-bot`](https://www.npmjs.com/package/@alemonjs/qq-bot)     | QQBot       |
| [`@alemonjs/discord`](https://www.npmjs.com/package/@alemonjs/discord)   | Discord     |
| [`@alemonjs/kook`](https://www.npmjs.com/package/@alemonjs/kook)         | KOOK        |
| [`@alemonjs/telegram`](https://www.npmjs.com/package/@alemonjs/telegram) | Telegram    |
| [`@alemonjs/bubble`](https://www.npmjs.com/package/@alemonjs/bubble)     | Bubble      |
| [`@alemonjs/onebot`](https://www.npmjs.com/package/@alemonjs/onebot)     | OneBot      |
| [`@alemonjs/wechat`](https://www.npmjs.com/package/@alemonjs/wechat)     | Wechat      |

### Extensions

| Package                                                                | Description        |
| ---------------------------------------------------------------------- | ------------------ |
| [`@alemonjs/db`](https://www.npmjs.com/package/@alemonjs/db)           | 数据库模块         |
| [`@alemonjs/process`](https://www.npmjs.com/package/@alemonjs/process) | 桌面端进程通信模块 |
| [`create-alemonjs`](https://www.npmjs.com/package/create-alemonjs)     | 项目脚手架         |

## Ecosystem

| Project                                                                   | Description            |
| ------------------------------------------------------------------------- | ---------------------- |
| [`lvyjs`](https://github.com/lemonade-lab/lvyjs/tree/main/packages/lvyjs) | Node.js 开发与打包工具 |
| [`jsxp`](https://github.com/lemonade-lab/lvyjs/tree/main/packages/jsxp)   | 截图工具               |
| [`alemondesk`](https://github.com/lemonade-lab/alemondesk)                | 桌面端项目             |
| [`alemongo`](https://github.com/lemonade-lab/alemongo)                    | 服务端项目             |
| [`alemonapp`](https://github.com/lemonade-lab/alemonapp)                  | 手机端项目             |
| [`alemonx`](https://github.com/lemonade-lab/alemonx)                      | Agent开发运维          |

## Monorepo

```text
packages/      核心包与平台适配器
packages-ex/   扩展能力
packages-cl/   脚手架
frontends/     前端与桌面相关界面
```

## Contributing

欢迎提交 issue、讨论与 PR。

<a href="https://github.com/lemonade-lab/docs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lemonade-lab/alemonjs" alt="contributors" />
</a>
