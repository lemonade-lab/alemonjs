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
它把事件处理、声明式路由、Hook、消息格式化与多通道通信协议整合在一起，让同一套业务代码可以接入 QQ、Discord、KOOK、Telegram、OneBot、飞书、Slack、Teams 等平台。

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

`useMe().isAtMe()` 可用于判断当前消息是否 @ 了机器人：

```ts
const [me] = useMe();

if (me.isAtMe()) {
  // 处理 @ 机器人的消息
}
```

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

| Package                                                                              | Description    |
| ------------------------------------------------------------------------------------ | -------------- |
| [`@alemonjs/qq-bot`](https://www.npmjs.com/package/@alemonjs/qq-bot)                 | QQ 机器人      |
| [`@alemonjs/discord`](https://www.npmjs.com/package/@alemonjs/discord)               | Discord(DC)    |
| [`@alemonjs/kook`](https://www.npmjs.com/package/@alemonjs/kook)                     | KOOK           |
| [`@alemonjs/telegram`](https://www.npmjs.com/package/@alemonjs/telegram)             | Telegram(TG)   |
| [`@alemonjs/bubble`](https://www.npmjs.com/package/@alemonjs/bubble)                 | Bubble         |
| [`@alemonjs/onebot`](https://www.npmjs.com/package/@alemonjs/onebot)                 | OneBot         |
| [`@alemonjs/milky`](https://www.npmjs.com/package/@alemonjs/milky)                   | Milky          |
| [`@alemonjs/wechat`](https://www.npmjs.com/package/@alemonjs/wechat)                 | 个人微信       |
| [`@alemonjs/wechat-clawbot`](https://www.npmjs.com/package/@alemonjs/wechat-clawbot) | 微信机器人     |
| [`@alemonjs/wecom`](https://www.npmjs.com/package/@alemonjs/wecom)                   | 企业微信机器人 |
| [`@alemonjs/douyin`](https://www.npmjs.com/package/@alemonjs/douyin)                 | 抖音桌面       |
| [`@alemonjs/douyinbot`](https://www.npmjs.com/package/@alemonjs/douyinbot)           | 抖音机器人     |

### Social Platform Adapters

以下 18 个适配包独立安装、配置和运行，要求 Node.js 22.22+。包名链接指向接入说明，API 对照列出原生入口、框架动作和能力边界。

| Package                                                           | Platform                    | API 对照                               |
| ----------------------------------------------------------------- | --------------------------- | -------------------------------------- |
| [`@alemonjs/dingtalk`](packages/dingtalk/README.md)               | 钉钉                        | [API](packages/dingtalk/API.md)        |
| [`@alemonjs/feishu`](packages/feishu/README.md)                   | 飞书 / Lark                 | [API](packages/feishu/API.md)          |
| [`@alemonjs/google-chat`](packages/google-chat/README.md)         | Google Chat                 | [API](packages/google-chat/API.md)     |
| [`@alemonjs/heybox`](packages/heybox/README.md)                   | 黑盒语音                    | [API](packages/heybox/API.md)          |
| [`@alemonjs/icqq`](packages/icqq/README.md)                       | ICQQ                        | [API](packages/icqq/API.md)            |
| [`@alemonjs/instagram`](packages/instagram/README.md)             | Instagram Messaging         | [API](packages/instagram/API.md)       |
| [`@alemonjs/irc`](packages/irc/README.md)                         | IRCv3                       | [API](packages/irc/API.md)             |
| [`@alemonjs/line`](packages/line/README.md)                       | LINE                        | [API](packages/line/API.md)            |
| [`@alemonjs/matrix`](packages/matrix/README.md)                   | Matrix                      | [API](packages/matrix/API.md)          |
| [`@alemonjs/mattermost`](packages/mattermost/README.md)           | Mattermost                  | [API](packages/mattermost/API.md)      |
| [`@alemonjs/messenger`](packages/messenger/README.md)             | Facebook Messenger          | [API](packages/messenger/API.md)       |
| [`@alemonjs/slack`](packages/slack/README.md)                     | Slack                       | [API](packages/slack/API.md)           |
| [`@alemonjs/teams`](packages/teams/README.md)                     | Microsoft Teams             | [API](packages/teams/API.md)           |
| [`@alemonjs/twitch`](packages/twitch/README.md)                   | Twitch                      | [API](packages/twitch/API.md)          |
| [`@alemonjs/wechat-kf`](packages/wechat-kf/README.md)             | 微信客服                    | [API](packages/wechat-kf/API.md)       |
| [`@alemonjs/wechat-official`](packages/wechat-official/README.md) | 微信公众号                  | [API](packages/wechat-official/API.md) |
| [`@alemonjs/whatsapp`](packages/whatsapp/README.md)               | WhatsApp Business Cloud API | [API](packages/whatsapp/API.md)        |
| [`@alemonjs/zulip`](packages/zulip/README.md)                     | Zulip                       | [API](packages/zulip/API.md)           |

### API Coverage

适配器将已实现的能力映射为统一事件和框架动作，并通过 `useClient` 的 `client.api` 通道提供原生方法调用。实际可用动作可通过 `connection.status` 的 `capabilities` 查询；消息格式、媒体类型、发送目标和权限仍遵循各平台规则。

每个社交适配包提供 `API.md` 和 `api-inventory.json`，分别记录框架动作对应、未映射项，以及当前 SDK / 驱动的原生方法清单。SDK 方法可调用、动作已注册和业务能力完整支持是不同的状态；方法数量和动作数量不能直接作为平台 API 覆盖率。

当前已补齐钉钉机器人服务的 29 个具名 API，以及飞书媒体上传、媒体 key 复用发送和表情移除。其余端点契约、缺失类型及框架映射仍在逐包完善，详情见 [社交适配包 API 核对进度](docs/social-api-progress.md)。

仓库内可运行以下命令验证这 18 个适配包：

```bash
# 检查 API 对照表与当前框架、驱动源码是否一致
yarn audit:social

# 构建核心，并运行对照表检查、API 类型契约检查和离线测试
yarn test:social

# 构建适配包及其依赖
yarn build:social

# 逐包运行 ESLint
yarn lint:social
```

离线测试与构建通过不代表真实账号登录、权限审核或线上消息投递已经验证。

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
| [`alemonx`](https://github.com/lemonade-lab/alemonx)                      | Agent 开发运维         |

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
