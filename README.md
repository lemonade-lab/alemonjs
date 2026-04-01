# [ALemonJS](https://alemonjs.com)

[![npm version](https://img.shields.io/npm/v/alemonjs.svg)](https://www.npmjs.com/package/alemonjs)
[![license](https://img.shields.io/npm/l/alemonjs.svg)](https://github.com/lemonade-lab/alemonjs/blob/main/LICENSE)

专用于开发跨平台聊天机器人的 Node.js 框架，提供完整的事件驱动架构、声明式路由、Hook 系统和多通道通信协议（CBP），一套代码即可运行在 QQ、Discord、KOOK、Telegram 等多个平台。

官网文档 https://alemonjs.com

## 🚀 快速开始

```bash
# 创建新项目
npm create alemonjs@latest
# 进入项目目录
cd my-bot
# 安装依赖
yarn install
# 启动开发
yarn dev
```

## 🏗️ 架构设计

```
┌──────────────────────────────────────────────────────┐
│                    开发者应用层                        │
│   defineChildren → defineRouter → handler(response)   │
│                   defineMiddleware                     │
│   Hooks: useMessage, useMention, useSubscribe         │
│   Format: 链式消息构建器                               │
└─────────────────────┬────────────────────────────────┘
                      │  CBP (Cross-platform Protocol)
┌─────────────────────┴────────────────────────────────┐
│                   ALemonJS Core                       │
│   事件处理器 (过滤/去重/中间件/订阅/响应)              │
│   模块加载器 (loadChildren → ChildrenApp 生命周期)    │
│   通信层:                                             │
│   ├─ Direct Channel (UDS + V8 序列化, ~20μs)         │
│   ├─ IPC Bridge (fork 子进程, ~50μs)                 │
│   └─ WebSocket (flattedJSON, ~1ms)                   │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────┴────────────────────────────────┐
│                  平台适配器层                          │
│   @alemonjs/discord  │ @alemonjs/qq-bot               │
│   @alemonjs/kook     │ @alemonjs/onebot               │
└──────────────────────────────────────────────────────┘
```

### 核心特性

- **事件驱动架构** — 基于事件选择器（selects）和响应处理器（handler）的模式，支持消息、交互、成员变动等 30+ 种事件类型，生命周期覆盖创建（create）、挂载（mount）、卸载（unmount）
- **CBP 通信协议** — 三通道通信（Direct Channel / IPC / WebSocket），Platform 进程与 Client 进程分离，支持本地运行或远程服务器连接
- **声明式路由** — `defineRouter` 支持精确匹配、前缀匹配、正则匹配和嵌套子路由，配合 `lazy()` 懒加载按需加载处理器
- **模块化插件** — `defineChildren` 定义子模块入口，包含 `onCreated → register → onMounted → unMounted` 完整生命周期
- **自定义平台** — 通过 `definePlatform` 可对接任意聊天平台

## 🔧 核心组件

### Hook 系统

| Hook            | 用途                                 |
| --------------- | ------------------------------------ |
| `useMessage`    | 发送消息（文本/图片/按钮等）         |
| `useMention`    | 获取 @提及用户，支持条件过滤         |
| `useSubscribe`  | 跨生命周期事件订阅（如等待用户回复） |
| `useChannel`    | 频道操作                             |
| `useGuild`      | 服务器/群组操作                      |
| `useMember`     | 成员信息管理                         |
| `usePermission` | 权限查询与管理                       |
| `useReaction`   | 表情回应操作                         |
| `useRole`       | 角色管理                             |
| `useUser`       | 用户信息操作                         |
| `useHistory`    | 历史消息查询                         |
| `useMedia`      | 媒体资源操作                         |
| `useAnnounce`   | 公告管理                             |
| `useRequest`    | 请求处理                             |
| `useClient`     | 客户端连接操作                       |
| `useMe`         | 当前机器人信息                       |
| `useEvent`      | 事件上下文访问                       |

### 消息格式化（Format）

链式 API 构建富文本消息：

```typescript
import { useEvent, useMessage, Format } from 'alemonjs';

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
  format.addImage('https://example.com/img.png');
  format.addButtonGroup(Format.createButtonGroup().addRow().addButton('确认', { action: 'confirm' }));
  message.send({ format });
};
```

支持文本、图片、按钮组、Markdown、@提及、链接、附件、音视频等消息类型。

### 事件构建（FormatEvent）

推荐使用类型安全的 `FormatEvent` API 构建事件对象：

```typescript
import { FormatEvent } from 'alemonjs';

FormatEvent.create('message.create')
  .addPlatform({ Platform: 'discord', value: raw })
  .addGuild({ GuildId: 'g1', SpaceId: 's1' })
  .addMessage({ MessageId: 'm1' });
```

### 声明式路由

```typescript
import { defineChildren, defineRouter, lazy } from 'alemonjs';

export default defineChildren({
  async register() {
    return {
      responseRouter: defineRouter([
        { exact: '/ping', handler: lazy(() => import('./response/ping')) },
        { prefix: '/echo', handler: lazy(() => import('./response/echo')) },
        { regular: /^\/help/, handler: lazy(() => import('./response/help')) },
        {
          prefix: '/admin',
          selects: ['message.create'],
          handler: lazy(() => import('./middleware/admin-auth')),
          children: [{ exact: '/admin ban', handler: lazy(() => import('./response/admin-ban')) }]
        }
      ])
    };
  }
});
```

路由配置支持 `selects` 属性按事件类型过滤，可指定单个或多个事件类型：

```typescript
{ exact: '/ping', selects: ['message.create', 'private.message.create'], handler: ... }
```

### 事件处理管线

```
Platform 事件 → onProcessor (过滤/去重)
    → expendSubscribeCreate (创建阶段订阅)
    → expendMiddleware (中间件链)
    → expendSubscribeMount (挂载阶段订阅)
    → expendEvent (路由匹配 → handler 执行)
    → expendSubscribeUnmount (卸载阶段订阅)
```

### 配置系统

通过 `alemon.config.yaml` 管理，支持命令行参数 > 配置文件 > 默认值的合并优先级，100ms 防抖变更通知。

## 📦 平台支持

| Project                | Status                      | Description |
| ---------------------- | --------------------------- | ----------- |
| 👉[@alemonjs/qq-bot]   | [![qq-bot-s]][qq-bot-p]     | QQ 机器人   |
| 👉[@alemonjs/discord]  | [![discord-s]][discord-p]   | Discord     |
| 👉[@alemonjs/onebot]   | [![onebot-s]][onebot-p]     | OneBot      |
| 👉[@alemonjs/kook]     | [![kook-s]][kook-p]         | KOOK        |
| 👉[@alemonjs/telegram] | [![telegram-s]][telegram-p] | Telegram    |
| 👉[@alemonjs/bubble]   | [![bubble-s]][bubble-p]     | Bubble      |

[@alemonjs/qq-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-bot
[qq-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-bot.svg
[qq-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-bot
[@alemonjs/discord]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/discord
[discord-s]: https://img.shields.io/npm/v/@alemonjs/discord.svg
[discord-p]: https://www.npmjs.com/package/@alemonjs/discord
[@alemonjs/onebot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/onebot
[onebot-s]: https://img.shields.io/npm/v/@alemonjs/onebot.svg
[onebot-p]: https://www.npmjs.com/package/@alemonjs/onebot
[@alemonjs/kook]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/kook
[kook-s]: https://img.shields.io/npm/v/@alemonjs/kook.svg
[kook-p]: https://www.npmjs.com/package/@alemonjs/kook
[@alemonjs/telegram]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/telegram
[telegram-s]: https://img.shields.io/npm/v/@alemonjs/telegram.svg
[telegram-p]: https://www.npmjs.com/package/@alemonjs/telegram
[@alemonjs/bubble]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/bubble
[bubble-s]: https://img.shields.io/npm/v/@alemonjs/bubble.svg
[bubble-p]: https://www.npmjs.com/package/@alemonjs/bubble

## 📦 扩展包

| Package               | Status                    | Description                          |
| --------------------- | ------------------------- | ------------------------------------ |
| 👉[@alemonjs/db]      | [![db-s]][db-p]           | 数据库模块（Redis / MySQL / SQLite） |
| 👉[@alemonjs/process] | [![process-s]][process-p] | 桌面端进程通信模块                   |
| 👉[create-alemonjs]   | [![create-s]][create-p]   | 项目脚手架                           |

[@alemonjs/db]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/db
[db-s]: https://img.shields.io/npm/v/@alemonjs/db.svg
[db-p]: https://www.npmjs.com/package/@alemonjs/db
[@alemonjs/process]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/process
[process-s]: https://img.shields.io/npm/v/@alemonjs/process.svg
[process-p]: https://www.npmjs.com/package/@alemonjs/process
[create-alemonjs]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/create-alemonjs
[create-s]: https://img.shields.io/npm/v/create-alemonjs.svg
[create-p]: https://www.npmjs.com/package/create-alemonjs

## 🌐 生态

| Project        | Description                    |
| -------------- | ------------------------------ |
| 👉[lvyjs]      | 开发环境（Node.js 捆绑打包器） |
| 👉[jsxp]       | 截图工具(puppeteer)            |
| 👉[alemondesk] | 桌面端版本（React + Golang）   |
| 👉[alemongo]   | 服务端版本（React + Golang）   |

[lvyjs]: https://github.com/lemonade-lab/lvyjs/tree/main/packages/lvyjs
[jsxp]: https://github.com/lemonade-lab/lvyjs/tree/main/packages/jsxp
[alemondesk]: https://github.com/lemonade-lab/alemondesk
[alemongo]: https://github.com/lemonade-lab/alemongo

## 贡献

<a href="https://github.com/lemonade-lab/docs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lemonade-lab/alemonjs" />
</a>
