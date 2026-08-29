# @alemonjs/qq-bot

QQ 开放平台（QQ Bot）适配器，用于连接 [QQ 开放平台](https://q.qq.com/#/) 官方接口。

- 平台：<https://q.qq.com/#/>
- 开发文档：<https://bot.q.qq.com/wiki/>
- 支持场景：群聊（Group）、单聊（C2C）、频道（Guild / 公域、私域）、频道私信（DMS）、互动按钮（Interaction）

---

## 简介

- **双连接模式**：默认 WebSocket 直连官方网关；配置 `route`/`port` 或 `ws` 可切换 Webhook 模式
- **多场景覆盖**：群聊 / 单聊走 OpenAPI v2（`/v2/users`、`/v2/groups`），频道走 Server-Inter 接口
- **完整消息类型**：文本、图片、Markdown、按钮（5×5）、Ark 卡片/列表/大卡、文件/音视频富媒体
- **群管理能力**：入群申请审批、入群自动审批策略、群成员禁言、群信息/状态/成员查询
- **大文件分片上传**：超 10MB 自动切换 `upload_prepare → COS 直传 → part_finish → 合并` 全流程
- **流式消息**：单聊持续更新同一条回复（`stream_messages`）+ 输入状态通知

---

## 目录

| 章节                                | 说明                                      |
| ----------------------------------- | ----------------------------------------- |
| [简介](#简介)                       | 适配器能力概览                            |
| [安装](#安装)                       | 安装命令                                  |
| [快速开始](#快速开始)               | 最小可运行示例（Router + defineChildren） |
| [扫码登录](#扫码登录)               | 未配置密钥时扫码授权，自动写入配置        |
| [配置](#配置)                       | 完整配置项与连接模式                      |
| [调用方式](#调用方式)               | 四种 API 调用方式                         |
| [API 总览](#api-overview)           | 全部 API 索引（点击跳转详解）             |
| [QQ-Bot 消息类型](#qq-bot-消息类型) | Format 与平台消息类型映射                 |
| [API 详解](#api-详解)               | 各 API 参数说明与示例                     |
| [SDK 方法速查](#sdk-方法速查)       | `QQBotAPI` 全部 SDK 方法                  |
| [事件支持](#事件支持)               | QQ 事件 → 标准事件映射表                  |
| [事件数据结构](#事件数据结构)       | 收到的消息数据结构与数据使用方法          |
| [常见问题](#常见问题)               | FAQ                                       |

---

## 安装

```sh
yarn add @alemonjs/qq-bot
# 或
npm install @alemonjs/qq-bot
```

---

## 快速开始

1. 在 [QQ 开放平台](https://q.qq.com/) 创建机器人，获取 `AppID` 与 `AppSecret`。

> 不想手动获取密钥？启动适配器时未配置 `app_id`/`secret` 会自动进入扫码登录流程，详见 [扫码登录](#扫码登录)。

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

> 更复杂的调用（调用群 API / 主动发送）见 [调用方式](#调用方式)。handler 内通过 `useEvent` / `useRoute` / `useMessage` 等 Hook 读取当前事件上下文，命令匹配交给 Router DSL，不在 handler 里重复判断命令名。

---

## 扫码登录

无需手动登录开放平台复制密钥：启动时未配置 `app_id`/`secret`（且未配置 `bots`），适配器会自动进入扫码授权流程。

### 流程

1. 启动适配器（默认 WebSocket 模式），终端输出授权二维码与链接，并在**运行目录**保存二维码图片（`qqbot-login-qr.png`，二维码刷新时自动覆盖）；
2. 使用**手机 QQ**（开放平台上该机器人的管理者账号）扫描二维码（终端直接扫，或打开保存的图片扫），并在页面中确认授权；
3. 适配器自动轮询授权结果，平台下发的凭证在本地解密（AES-256-GCM，密钥不落盘）；
4. `app_id` 与 `secret` 自动写入 `alemon.config.yaml` 的 `qq-bot` 节（保留文件中已有的注释与原格式），随后立即连接，无需重启。

### ⚠️ 扫码登录会重置旧的密钥

完成扫码授权后，平台将**重置该机器人的 AppSecret，旧密钥立即失效**：

- 同一机器人此前已在其他实例 / 框架中运行的，旧实例将无法继续鉴权，需更新为新写入配置的密钥；
- 重置后的新密钥即扫码流程写入本地配置的值，可在 `alemon.config.yaml` 的 `qq-bot.secret` 查看；
- 请确认该机器人没有其他正在使用的部署后再扫码。

### 说明

| 事项     | 说明                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------ |
| 触发条件 | 配置中未填写 `app_id`/`secret`，且未配置 `bots`（WebSocket 模式）                                |
| 二维码   | 终端出码 + 图片保存到运行目录（`qqbot-login-qr.png`），过期自动刷新（最多 3 次），总超时 10 分钟 |
| 凭证安全 | AppSecret 全程密文传输、本地解密，密钥仅存内存不落盘                                             |
| 失败处理 | 超时 / 刷新次数用尽 / 授权取消时跳过连接并输出日志，可重启重试或手动配置                         |
| Webhook  | Webhook 模式（配置 `route`/`port`/`ws`）不触发扫码流程，需自行填写完整配置                       |

---

## 配置

### 完整配置示例

```yaml
qq-bot:
  # ==================== 必填 ====================
  # 应用编号
  app_id: ''
  # 应用密钥（Webhook 模式下同时作为 ed25519 签名种子）
  secret: ''

  # ==================== 主人配置 ====================
  # 通过 UserKey 识别主人（在 alemon 中生成）
  master_key:
    - 'xxx'
  # 通过 UserId 识别主人（如 QQ 号）
  master_id:
    - 'yyy'

  # ==================== 连接模式 ====================
  # 1) 默认：WebSocket 直连官方网关（不配置 route/port/ws 即可）
  # 2) Webhook 模式：配置 route + port（一旦生效官方将禁用 WebSocket 模式，需公网 ip/域名）
  # port: 17157
  # route: '/webhook'
  # 3) 连接已存在的 Webhook 服务（如自建转发服务）
  # ws: 'ws://127.0.0.1:17157'
  # 4) 自定义网关 / 域名代理
  # gatewayURL: 'ws://[your ip]:8080'
  # base_url_gateway: 'https://[your addr]'
  # base_url_app_access_token: 'https://[your addr]'

  # ==================== 环境 ====================
  # 是否私域机器人（私域可订阅频道全量消息 MESSAGE_CREATE / 论坛事件）
  is_private: false
  # 沙盒环境（使用沙盒 API 域名）
  sandbox: false
  # WS 分片，默认 [0, 1]
  shard: [0, 1]
  # 自定义事件订阅（Intents），默认按 is_private 自动组装，一般无需配置
  intents: []

  # ==================== 消息格式 ====================
  # 将 Markdown 强制转换为纯文本发送（没有 MD 权限但使用了 MD 数据格式时）
  # 开启后 Markdown 与按钮将转为可读纯文本
  markdownToText: false
  # 隐藏不支持的消息类型（可选，默认: false）
  # 1：一级隐藏，不可读占位符（[视频]、[音频]、[图片]、[附件]等）被置空，可读内容保留
  # 2：二级隐藏，按钮仅显示指令数据（如 /挑战），链接仅显示 URL
  # 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
  # 4：四级隐藏，不进行任何转换，降级数据直接丢弃
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: 1
```

### 多 Bot（WebSocket）

`bots` 的键是稳定 BotId/AppId。配置多个 Bot 时，主动操作需提供 `BotId`，或设置 `default_bot`；事件回复会自动使用事件所属 Bot。Webhook 不支持该配置。

```yaml
qq-bot:
  default_bot: 'app-a'
  bots:
    app-a:
      secret: 'secret-a'
    app-b:
      secret: 'secret-b'
```

### 配置项说明

| 配置项                      | 类型              | 默认值     | 必填 | 说明                                                                                                                                                  |
| --------------------------- | ----------------- | ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app_id`                    | string            | -          | ✅   | 应用编号（AppID），开放平台创建机器人后获得                                                                                                           |
| `secret`                    | string            | -          | ✅   | 应用密钥（AppSecret）；Webhook 模式同时作为 [ed25519 签名](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/sign.html) 的种子 |
| `master_key`                | string[]          | `[]`       | -    | 主人 UserKey 列表，使用 `isMaster` 判断                                                                                                               |
| `master_id`                 | string[]          | `[]`       | -    | 主人 UserId 列表（如 QQ 号 / openid），使用 `isMaster` 判断                                                                                           |
| `route`                     | string            | `/webhook` | -    | Webhook 回调路由，配置后启用 Webhook 模式                                                                                                             |
| `port`                      | string            | `17157`    | -    | Webhook 本地监听端口                                                                                                                                  |
| `ws`                        | string            | -          | -    | 已存在的 Webhook 服务地址，配置后作为 WS 客户端连接（`QQBotClient`）                                                                                  |
| `gatewayURL`                | string            | -          | -    | 直连 WebSocket 网关地址，配置后不再自动请求 `/gateway`                                                                                                |
| `base_url_gateway`          | string            | -          | -    | 网关域名代理（用于接入官方之外的服务端）                                                                                                              |
| `base_url_app_access_token` | string            | -          | -    | 获取 access_token 的域名代理                                                                                                                          |
| `is_private`                | boolean           | `false`    | -    | 是否私域机器人；私域自动订阅 `GUILD_MESSAGES`、`FORUMS_EVENT`，公域订阅 `PUBLIC_GUILD_MESSAGES`                                                       |
| `sandbox`                   | boolean           | `false`    | -    | 沙盒环境，使用 `https://sandbox.api.sgroup.qq.com`                                                                                                    |
| `shard`                     | number[]          | `[0, 1]`   | -    | WebSocket 分片                                                                                                                                        |
| `intents`                   | string[]          | 自动组装   | -    | 自定义事件订阅，覆盖默认组装逻辑（见 [intents.ts](src/sdk/intents.ts)）                                                                               |
| `markdownToText`            | boolean           | `false`    | -    | Markdown 降级为纯文本发送                                                                                                                             |
| `hideUnsupported`           | boolean \| number | `false`    | -    | 隐藏不支持消息类型（1~4 级，见上）                                                                                                                    |

### 连接模式

| 模式              | 触发条件                               | 说明                                                                       |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| WebSocket（默认） | 不配置 `route`/`port`/`ws`             | 直连官方 `wss://api.sgroup.qq.com` 网关，自动鉴权、心跳、重连（最多 5 次） |
| Webhook           | 配置 `route` 或 `port`                 | 本地 Koa 服务接收官方回调，ed25519 验签；需公网 ip/域名                    |
| WS 客户端         | 配置 `ws`                              | 作为客户端连接已存在的 Webhook 服务（不启动本地服务）                      |
| 自定义网关        | 配置 `gatewayURL` / `base_url_gateway` | 用于连接自建网关或域名代理                                                 |

---

## 调用方式

在 alemonjs 开发中调用 QQ Bot 能力有四种方式，按推荐程度排列：

### 一、事件内回复（最常用）

收到消息后直接回复，框架自动按当前事件场景（群/单聊/频道）选择发送通道。命令匹配交给 Router DSL，handler 只负责回复：

```ts
// src/index.ts —— 注册路由
appGroup.use('ping', () => import('./response/ping'));

// src/response/ping.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText('pong') });
};
```

结构化消息（文本 + 图片 + 按钮 + Markdown）用 `Format` 链式构建，文本、Markdown、按钮统一挂到同一个 `format`：

```ts
// src/response/card.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 按钮组：一行两个按钮（command 类型，点击自动在输入框插入指令）
  const bt = Format.createButtonGroup().addRow().addButton('确认', '/confirm').addButton('取消', '/cancel');

  await message.send({
    format: Format.create().addText('请确认操作').addButtonGroup(bt)
  });
};
```

> `useMessage` 不传事件时自动读取当前事件上下文。消息统一用 `Format` 构建，可组合 `addText` / `addImage` / `addMention` / `addButtonGroup` / `addMarkdown` / `addMarkdownOriginal` / `addAttachment` / `addAudio` / `addVideo`；QQ-Bot 平台消息类型详见 [QQ-Bot 消息类型](#qq-bot-消息类型)。

### 二、`useClient` 直接调用 SDK（推荐用于能力调用）

通过框架 `useClient(API)` 传入 `@alemonjs/qq-bot` 导出的 `API` 类，返回一个代理客户端，方法调用会透传到 SDK（`QQBotAPI`），返回原始接口数据。仅当通用 hooks 不够表达、需要平台特有能力时使用：

```ts
// src/response/group-info.ts
import { useClient, useEvent, useMessage, Format } from 'alemonjs';
import { API, platform } from '@alemonjs/qq-bot';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  // 仅 QQ-Bot 平台走平台特有 API
  if (event.current.Platform !== platform) return;

  const [client] = useClient(API);
  // 获取群信息（群 openid 位于事件的 ChannelId）
  const res = await client.groupsInfo('GROUP_OPENID');

  await message.send({ format: Format.create().addText(JSON.stringify(res)) });
};
```

> 也支持 `@alemonjs/qq-bot` 自带的平台包装 `useClient(event)`（需传当前事件，返回 `[client, value]`），两者都会向适配器发送 `client.api` 透传请求。所有 SDK 方法见下方 [SDK 方法速查](#sdk-方法速查)，如 `groupsInfo`、`groupsJoinRequestList`、`usersOpenMessages` 等均可直接调用。

### 三、`sendAction` 调用适配器 Action（能力动作）

`@alemonjs/qq-bot` 在 `cbp.onactions` 中注册了全部能力动作（`message.send`、`group.joinRequest.approve` 等）。在应用侧通过 `alemonjs` 的 `sendAction` 调用，返回标准 `Result[]`：

```ts
// src/response/approve.ts
import { useEvent, useMessage, sendAction, ResultCode, Format } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  const results = await sendAction({
    action: 'group.joinRequest.approve',
    payload: {
      // 透传来源事件：群 openid / 成员 openid 由适配器自动推断，无需手动传
      event: event.current,
      params: {
        op: 'approve',
        joinRequestId: 'JOIN_REQUEST_ID'
      }
    }
  });
  const ok = results.some(item => item.code === ResultCode.Ok);

  await message.send({ format: Format.create().addText(ok ? '已通过' : '操作失败') });
};
```

> **事件上下文自动推断**：与 `message.send` 一致，`payload` 中透传 `event`（来源事件对象）后，群 openid（群消息事件位于 `ChannelId`）、成员 openid（位于 `UserId`）、频道 id（`GuildId`）、子频道 id（`ChannelId`）等均可省略，由适配器自动推断；显式传入的 `payload.ChannelId` / `payload.UserId` / `params.groupOpenId` / `params.memberOpenId` 优先级更高。各 Action 的参数与响应见下方 [API 详解](#api-详解)。框架自带的 `useMember`、`useMessage`、`useMedia`、`useGuild`、`useRequest` 等 Hook 内部即通过 `sendAction` 发送动作，优先使用 Hook 而非直接调 Action。

### 四、主动发送消息（无事件上下文）

通过 `MessageDirect` 主动向目标发送消息（基于 `message.send.channel` / `message.send.user`）：

```ts
import { MessageDirect, Format } from 'alemonjs';

// 主动向群发送（SpaceId 传群 openid 或频道子频道 id）
await MessageDirect.create().sendToChannel({
  SpaceId: 'GROUP_OPENID_OR_CHANNEL_ID',
  format: Format.create().addText('群公告：今晚 8 点开黑')
});

// 主动向用户发送（OpenID 传 C2C 用户 openid 或频道私信 guild_id）
await MessageDirect.create().sendToUser({
  OpenID: 'USER_OPENID',
  format: Format.create().addText('晚上好')
});
```

> 也支持底层 `sendAction({ action: 'message.send.channel', payload: { ChannelId, params: { format } } })` 等价调用。

---

<a id="api-overview"></a>

## API 总览（点击跳转）

### 消息

| API                                               | 说明                                        |
| ------------------------------------------------- | ------------------------------------------- |
| [message.send](#api-message-send)                 | 回复 / 发送消息，自动按事件场景选择发送通道 |
| [message.send.channel](#api-message-send-channel) | 主动向频道（子频道/群）发送消息             |
| [message.send.user](#api-message-send-user)       | 主动向用户（C2C/频道私信）发送消息          |
| [message.delete](#api-message-delete)             | 撤回消息（群/频道/单聊/私信按场景分流）     |
| [message.get](#api-message-get)                   | 获取频道指定消息                            |
| [message.pin / message.unpin](#api-message-pin)   | 添加 / 移除频道精华消息                     |
| [mention.get](#api-mention-get)                   | 获取消息中 @ 提及的用户                     |
| [message.input.notify](#api-message-input-notify) | 发送“正在输入”状态通知（仅单聊）            |

### 群管理

| API                                                          | 说明                        |
| ------------------------------------------------------------ | --------------------------- |
| [group.info](#api-group-info)                                | 获取群基本信息              |
| [group.botState](#api-group-bot-state)                       | 获取机器人群内状态          |
| [group.member.info](#api-group-member-info)                  | 获取群成员详情              |
| [group.joinRequest.list](#api-group-join-request-list)       | 拉取入群申请列表            |
| [group.joinRequest.approve](#api-group-join-request-approve) | 审批入群申请（通过 / 拒绝） |
| [group.mute.setting](#api-group-mute-setting)                | 查询群禁言状态              |
| [group.mute.set](#api-group-mute-set)                        | 设置群成员禁言              |
| [group.strategy.list](#api-group-strategy)                   | 入群自动审批策略列表        |
| [group.strategy.create](#api-group-strategy)                 | 创建入群自动审批策略        |
| [group.strategy.update](#api-group-strategy)                 | 修改入群自动审批策略        |
| [group.strategy.delete](#api-group-strategy)                 | 删除入群自动审批策略        |
| [group.strategy.execute](#api-group-strategy)                | 执行策略全量扫描            |
| [group.strategy.whitelist](#api-group-strategy)              | 修改策略白名单              |

### 频道（Guild）

| API                                       | 说明                         |
| ----------------------------------------- | ---------------------------- |
| [channel.info](#api-channel-info)         | 获取子频道详情               |
| [channel.list](#api-channel-list)         | 获取频道（服务器）子频道列表 |
| [channel.create](#api-channel-create)     | 创建子频道                   |
| [channel.update](#api-channel-update)     | 修改子频道                   |
| [channel.delete](#api-channel-delete)     | 删除子频道                   |
| [channel.announce](#api-channel-announce) | 创建 / 删除频道公告          |

### 成员

| API                                          | 说明                                     |
| -------------------------------------------- | ---------------------------------------- |
| [member.info](#api-member-info)              | 获取频道成员详情                         |
| [member.list](#api-member-list)              | 获取频道成员列表                         |
| [member.kick](#api-member-kick)              | 移出频道成员                             |
| [member.ban / member.unban](#api-member-ban) | 禁言 / 解除禁言（QQ 频道以禁言代替封禁） |
| [member.mute](#api-member-mute)              | 频道成员禁言（指定时长）                 |

### 服务器（Guild）

| API                           | 说明                     |
| ----------------------------- | ------------------------ |
| [guild.info](#api-guild-info) | 获取频道（服务器）详情   |
| [guild.list](#api-guild-list) | 获取机器人加入的频道列表 |
| [guild.mute](#api-guild-mute) | 全员禁言                 |

### 角色

| API                                           | 说明                  |
| --------------------------------------------- | --------------------- |
| [role.list](#api-role-list)                   | 获取频道身份组列表    |
| [role.create](#api-role-create)               | 创建身份组            |
| [role.update](#api-role-update)               | 修改身份组            |
| [role.delete](#api-role-delete)               | 删除身份组            |
| [role.assign / role.remove](#api-role-assign) | 分配 / 移除成员身份组 |

### 媒体 / 文件 / 上传

| API                                                       | 说明                                          |
| --------------------------------------------------------- | --------------------------------------------- |
| [media.send.user](#api-media-send-user)                   | 向用户发送富媒体（图片/视频/音频/文件）       |
| [media.upload.prepare](#api-media-upload-prepare)         | 分片上传准备                                  |
| [media.upload.part.finish](#api-media-upload-part-finish) | 分片完成上报                                  |
| [media.upload.chunked](#api-media-upload-chunked)         | 分片上传全流程（prepare→ 直传 →finish→ 合并） |
| [file.send.channel / file.send.user](#api-file-send)      | 向群 / 用户发送文件                           |
| [stream.message.send](#api-stream-message-send)           | 单聊流式消息                                  |

### 表情 / 权限 / 交互 / 其他

| API                                                 | 说明                             |
| --------------------------------------------------- | -------------------------------- |
| [reaction.add / reaction.remove](#api-reaction-add) | 添加 / 删除表情表态              |
| [reaction.list](#api-reaction-list)                 | 表情表态用户列表                 |
| [permission.get / permission.set](#api-permission)  | 子频道用户权限查询 / 设置        |
| [interaction.response](#api-interaction-response)   | 互动事件回应（解除按钮 loading） |
| [me.info](#api-me-info)                             | 获取机器人自身信息               |
| [me.guilds](#api-me-guilds)                         | 获取机器人频道列表               |

---

## QQ-Bot 消息类型

QQ-Bot 平台支持的消息类型与 `Format` / `DataEnums` 的对应关系，以及平台特有的构造写法。

### Format → QQ-Bot 类型映射

| Format 构建器                               | DataEnums 类型                          | QQ-Bot 落地                       | 说明                                                 |
| ------------------------------------------- | --------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `Format.create().addText(text)`             | `Text`                                  | 纯文本 `msg_type: 0`              | 最常用                                               |
| `addMention(userId)`                        | `Mention`                               | `<@user_id>` / `<@everyone>`      | 群聊/单聊有效，频道无 @ 语法                         |
| `Format.createMarkdown().addLink()` 等      | `Markdown`                              | Markdown 消息 `msg_type: 2`       | 需要平台 MD 权限，否则可降级                         |
| `addMarkdownOriginal('**raw**')`            | `MarkdownOriginal`                      | Markdown 原始字符串 `msg_type: 2` | 平台侧直接渲染 raw 文本                              |
| `addImage(url)` / `addImage(buffer)`        | `Image` / `ImageFile` / `ImageURL`      | 富媒体图片 `msg_type: 7`          | 群/单聊先上传富媒体（file_type 1）；频道走 multipart |
| `addAudio(url)`                             | `Audio`                                 | 富媒体语音 `msg_type: 7`          | 群/单聊支持（file_type 3）；频道不支持降级           |
| `addVideo(url)`                             | `Video`                                 | 富媒体视频 `msg_type: 7`          | 群/单聊支持（file_type 2）；频道降级                 |
| `addAttachment(url, options?)`              | `Attachment`                            | 富媒体文件 `msg_type: 7`          | 群/单聊支持（file_type 4）；上传失败时降级           |
| `Format.createButtonGroup().addButton(...)` | `BT.group`                              | 按钮（keyboard）`msg_type: 2`     | 群/单聊最多 5 行 × 每行 5 个                         |
| -（直接传 `DataEnums`）                     | `ButtonTemplate`                        | 平台按钮模板 `keyboard.id`        | value 为平台侧模板 ID                                |
| -（直接传 `DataEnums`）                     | `Ark.list` / `Ark.Card` / `Ark.BigCard` | Ark 卡片 `msg_type: 3`            | QQ-Bot 特有，`Format` 无内置构建器                   |

### 文本与 @

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  await message.send({
    format: Format.create().addText('欢迎 ').addMention('USER_OPENID').addText(' 加入！')
  });
};
```

### Markdown（需平台权限）

使用 `Format.createMarkdown()` 链式构建：

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  const md = Format.createMarkdown()
    .addTitle('今日推荐')
    .addSubtitle('副标题')
    .addText('正文内容')
    .addBold('加粗')
    .addItalic('斜体')
    .addLink('显示文本', 'https://example.com')
    .addImage('https://img.url', { width: 200, height: 100 })
    .addCode('console.log(1)', { language: 'ts' })
    .addList('选项一', '选项二')
    .addBlockquote('引用')
    .addDivider();

  await message.send({ format: Format.create().addMarkdown(md) });
};
```

> 未开通 MD 权限时发送会失败，可在配置中开启 `markdownToText: true` 强制降级为纯文本。

### 按钮（BT.group）

使用 `Format.createButtonGroup()`，平台限制：最多 **5 行**，每行最多 **5 个**按钮，超出自动裁剪。

#### 数据结构

每个按钮最终发送到 QQ 平台的结构如下（适配器自动生成，`rawData` 可透传覆盖任意字段）：

```jsonc
{
  "keyboard": {
    "content": {
      // 小按钮样式（可选）：整个键盘使用小号按钮
      "style": { "font_size": "small" },
      "rows": [
        {
          "buttons": [
            {
              "id": "1",
              "render_data": {
                "label": "按钮文字",
                "visited_label": "点击后文字",
                "style": 0 // 0 灰色线框 / 1 蓝色线框 / 3 红框 / 4 蓝底白字
              },
              "action": {
                "type": 2, // 0 跳转链接 / 1 回调 / 2 指令
                "permission": { "type": 2, "specify_user_ids": [], "specify_role_ids": [] },
                "data": "指令或链接",
                "enter": false, // 指令按钮点击后自动发送
                "reply": false, // 指令按钮带引用回复
                "anchor": 0, // 1 唤起选图器（仅单聊）
                "click_limit": undefined, // 可操作点击次数限制
                "at_bot_show_channel_list": false, // 弹出子频道选择器
                "unsupport_tips": "当前客户端不支持此操作",
                // 点击确认弹窗（可选）
                "modal": { "content": "是否确认操作?", "confirm_text": "是", "cancel_text": "否" }
              }
            }
          ]
        }
      ]
    }
  }
}
```

#### 基本用法

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  const bt = Format.createButtonGroup()
    .addRow()
    .addButton('指令按钮', '/command', { type: 'command' })
    .addButton('跳转链接', 'https://example.com', { type: 'link' })
    .addRow()
    .addButton('自动回车', '/auto', { type: 'command', autoEnter: true });

  await message.send({ format: Format.create().addText('请选择').addButtonGroup(bt) });
};
```

#### 按钮样式（4 种）

`render_data.style` 对应关系，通过 `options.style` 设置（样式名或数字均可）：

| 样式名        | 样式编号 | 说明             |
| ------------- | -------- | ---------------- |
| `'gray'`      | `0`      | 灰色线框（默认） |
| `'blue'`      | `1`      | 蓝色线框         |
| `'red'`       | `3`      | 红框             |
| `'blue-fill'` | `4`      | 蓝底白字         |

```ts
await message.send({
  format: Format.create().addButtonGroup(
    Format.createButtonGroup()
      .addRow()
      .addButton('灰框', '/a', { style: 'gray' })
      .addButton('蓝框', '/b', { style: 'blue' })
      .addButton('红框', '/c', { style: 'red' })
      .addButton('蓝底白字', '/d', { style: 'blue-fill' })
  )
});
```

#### 小按钮样式

小按钮是**整个按钮消息的全局配置**（`keyboard.content.style = { font_size: 'small' }`），在按钮组上调用一次 `.smallButton()` 即可让整组按钮全部变小，按钮本身仍按普通按钮书写，无需逐按钮设置：

```ts
// 只需在按钮组上设置一次 .smallButton()
const bt = Format.createButtonGroup()
  .smallButton() // 全局小按钮样式
  .addRow()
  .addButton('选项一', '/opt1')
  .addButton('选项二', '/opt2');

await message.send({ format: Format.create().addText('小按钮键盘').addButtonGroup(bt) });
```

> 等效的原始协议写法：`keyboard.content.style = { font_size: 'small' }`（放在 `keyboard.content` 层级，对整个键盘生效）。

#### 点击确认弹窗

按钮点击后弹出确认框（`action.modal`），确认后才继续执行：

```ts
await message.send({
  format: Format.create().addButtonGroup(
    Format.createButtonGroup()
      .addRow()
      .addButton('领取奖励', '/reward', {
        type: 'command',
        modal: { content: '确定要领取奖励吗？', confirmText: '领取', cancelText: '取消' }
      })
  )
});
```

#### options 说明

| 选项                   | 类型                                             | 说明                                                                  |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `type`                 | `'command'` \| `'link'` \| `'call'`              | 指令按钮（默认，点击在输入框插入指令）/ 跳转链接 / 回调按钮           |
| `data`                 | string                                           | 按钮携带的数据（`type=command` 为指令文本，`type=link` 为跳转 URL）   |
| `autoEnter`            | boolean                                          | 指令按钮点击后自动发送                                                |
| `style`                | `'gray'` \| `'blue'` \| `'red'` \| `'blue-fill'` | 按钮样式（见上表）                                                    |
| `modal`                | `{ content?, confirmText?, cancelText? }`        | 点击确认弹窗，确认后继续执行                                          |
| `permission`           | `{ type?, userIds?, roleIds? }`                  | 操作权限：`type` 0 指定用户 / 1 仅管理 / 2 全部（默认）/ 3 指定身份组 |
| `toolTip`              | string                                           | 无权限点击时的提示                                                    |
| `reply`                | boolean                                          | 指令按钮带引用回复本消息                                              |
| `anchor`               | number                                           | `1` 点击后唤起选图器（仅单聊场景客户端支持）                          |
| `clickLimit`           | number                                           | 可操作点击次数限制（默认不限）                                        |
| `atBotShowChannelList` | boolean                                          | 指令按钮点击后弹出子频道选择器                                        |
| `rawData`              | object                                           | 透传的原始按钮数据（可覆盖 `render_data` / `action` 任意字段）        |

> 兼容旧写法：`data` 传对象 `{ click, confirm, cancel }` 也会转换为确认弹窗（`content=click`、`confirm_text=confirm`、`cancel_text=cancel`）。

点击按钮后触发 `INTERACTION_CREATE` 事件（`interaction.create`），`data.resolved.button_data` 即按钮的 `data`，适配器已自动回应（解除 loading）。

### Ark 卡片（QQ-Bot 特有）

`Format` 没有内置 Ark 构建器，直接以 `DataEnums` 传入：

```ts
import { useMessage } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  await message.send({
    format: [
      {
        type: 'Ark.Card',
        value: {
          title: '标题',
          cover: 'https://example.com/cover.png',
          link: 'https://example.com',
          subtitle: '副标题',
          decs: '描述',
          prompt: '提示语',
          metadecs: '元描述'
        }
      }
    ]
  });
};
```

| 类型          | 对应模板 | 说明                            |
| ------------- | -------- | ------------------------------- |
| `Ark.list`    | 模板 23  | 列表（`[tip, content]`）        |
| `Ark.Card`    | 模板 24  | 图文卡片（标题/封面/链接/描述） |
| `Ark.BigCard` | 模板 37  | 大卡片                          |

> 模板详情参考官方文档 `server-inter/message/type/template/template_23.md`、`template_24.md`、`template_37.md`。

### 富媒体（图片 / 视频 / 音频 / 文件）

群聊与单聊支持图片、视频、语音、文件富媒体消息（`msg_type: 7`，先上传获取 `file_info`）。适配器按类型自动选择 `file_type` 并上传：

| 类型                                    | `file_type` | 格式     | 软限制 | 群聊 | 单聊 | 频道            |
| --------------------------------------- | ----------- | -------- | ------ | ---- | ---- | --------------- |
| 图片 `Image` / `ImageFile` / `ImageURL` | 1           | png、jpg | 20 MB  | ✅   | ✅   | ✅（multipart） |
| 视频 `Video`                            | 2           | mp4      | 30 MB  | ✅   | ✅   | ❌ 降级         |
| 语音 `Audio`                            | 3           | silk     | 20 MB  | ✅   | ✅   | ❌ 降级         |
| 文件 `Attachment`                       | 4           | 不限     | 200 MB | ✅   | ✅   | ❌ 降级         |

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 图片（URL / Buffer）
  await message.send({ format: Format.create().addImage('https://example.com/a.png') });
  // 视频（URL / file:// / base64:// / Buffer）
  await message.send({ format: Format.create().addVideo('https://example.com/a.mp4') });
  // 语音（silk 格式）
  await message.send({ format: Format.create().addAudio('https://example.com/a.silk') });
  // 文件
  await message.send({ format: Format.create().addAttachment('https://example.com/a.zip', { filename: 'a.zip' }) });
};
```

> 说明：
>
> - 富媒体消息（`msg_type: 7`）无法携带原生 Markdown/按钮，适配器会将 MD/按钮降级为文本合入 `content`，并移除已作为富媒体发送的占位符
> - 值支持 `https://` / `http://`（自动拉取转 base64）、`file://` 本地路径、`base64://`、Buffer
> - 超过软限制时降级为文件类型，超过 200 MB 硬限制返回错误
> - 大于 10MB 的文件自动走分片上传流程
> - 频道（Guild）接口仅支持图片（`file_image`），视频/音频/文件在频道场景降级为 `[视频]` / `[音频]` / `[附件]` 占位文本

### 降级策略

`markdownToText` 与 `hideUnsupported` 两个配置项控制不支持类型的降级行为（见 [配置](#配置)）：

- `markdownToText: true`：Markdown 与按钮全部转为纯文本发送，适合没有 MD 权限的机器人
- `hideUnsupported: 1~4`：按级别隐藏不支持的占位符（`[视频]`、`[音频]` 等），转换后内容为空则跳过发送

---

## API 详解

> 各 API 均对应官方开发文档中的 HTTP 接口。以下示例均为 `sendAction` 调用方式；除特殊说明外，均可使用 `useClient` 的 SDK 方法获得原始返回数据。需要场景上下文的 action 均支持在 `payload` 中透传 `event`（来源事件对象）自动推断群/频道/用户 id，显式传参优先级更高（见 [调用方式](#调用方式)）。

### 消息 API

<a id="api-message-send"></a>

#### message.send — 回复 / 发送消息

自动按事件的 `_tag` 分发到对应发送通道（群 @、群消息、单聊、频道、频道私信），并支持图片 / Markdown / 按钮 / Ark。

**调用方式一：框架 `useMessage`（推荐）**

```ts
// src/response/hello.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 纯文本
  await message.send({ format: Format.create().addText('你好') });
  // 图片（URL / Buffer）
  await message.send({ format: Format.create().addImage('https://example.com/a.png') });
  // Markdown（需要平台 MD 权限）
  await message.send({
    format: Format.create().addMarkdown(Format.createMarkdown().addTitle('标题').addText('内容'))
  });
  // 文本 + 按钮
  await message.send({
    format: Format.create().addText('请选择').addButtonGroup(Format.createButtonGroup().addRow().addButton('确认', '/confirm'))
  });
};
```

**调用方式二：`sendAction`**

```ts
const results = await sendAction({
  action: 'message.send',
  payload: {
    event, // 事件对象
    params: {
      format: [{ type: 'Text', value: '你好' }],
      // 图片转存校验失败时拒绝发送（可选）
      forceVerifyImageResource: true
    }
  }
});
```

**发送规则**（参考 `sends.ts`）：

- 纯文本 → `msg_type: 0`
- 包含图片 → 富媒体上传后发送 `msg_type: 7`（Markdown/按钮自动降级为文本合入）
- 包含 Markdown/按钮 → `msg_type: 2`（`markdown.content` 前置合并文本）
- 包含 Ark 卡片 → `msg_type: 3`
- `markdownToText: true` 时全部降级为纯文本
- `hideUnsupported` 转换后内容为空时跳过发送

<a id="api-message-send-channel"></a>

#### message.send.channel — 主动发送到频道 / 群

| 参数            | 类型        | 说明                      |
| --------------- | ----------- | ------------------------- |
| `ChannelId`     | string      | 群 openid 或频道子频道 id |
| `params.format` | DataEnums[] | 消息内容                  |

```ts
// 推荐：MessageDirect
await MessageDirect.create().sendToChannel({
  SpaceId: 'GROUP_OPENID',
  format: Format.create().addText('通知')
});

// 或 sendAction
await sendAction({
  action: 'message.send.channel',
  payload: { ChannelId: 'GROUP_OPENID', params: { format: Format.create().addText('通知').value } }
});
```

<a id="api-message-send-user"></a>

#### message.send.user — 主动发送到用户

| 参数            | 类型        | 说明                                |
| --------------- | ----------- | ----------------------------------- |
| `UserId`        | string      | C2C 用户 openid 或频道私信 guild_id |
| `params.format` | DataEnums[] | 消息内容                            |

```ts
// 推荐：MessageDirect
await MessageDirect.create().sendToUser({
  OpenID: 'USER_OPENID',
  format: Format.create().addText('晚上好')
});

// 或 sendAction
await sendAction({
  action: 'message.send.user',
  payload: { UserId: 'USER_OPENID', params: { format: Format.create().addText('晚上好').value } }
});
```

<a id="api-message-delete"></a>

#### message.delete — 撤回消息

按事件上下文（`SpaceId` / `OpenId`）自动分流到 群撤回 / 频道撤回 / 单聊撤回 / 私信撤回。

| 参数        | 类型   | 说明                                                                                                         |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `MessageId` | string | 要撤回的消息 ID                                                                                              |
| `event`     | object | 当前事件对象（`SpaceId`（`GROUP:`/`GUILD:`）、`OpenId`（`C2C:`/`DIRECT:`）、`ChannelId` 从中读取并自动分流） |

```ts
const [e] = useEvent();

await sendAction({
  action: 'message.delete',
  payload: { MessageId: e.current.MessageId, event: e.current }
});
```

> 对应 SDK：`groupMessageDelete`、`channelsMessagesDelete`、`userMessageDelete`、`dmsMessageDelete`。

<a id="api-message-get"></a>

#### message.get — 获取频道消息

| 参数        | 类型   | 说明      |
| ----------- | ------ | --------- |
| `ChannelId` | string | 子频道 id |
| `MessageId` | string | 消息 ID   |

```ts
await sendAction({ action: 'message.get', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
```

<a id="api-message-pin"></a>

#### message.pin / message.unpin — 频道精华消息

```ts
await sendAction({ action: 'message.pin', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
await sendAction({ action: 'message.unpin', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
```

> 对应 SDK：`channelsPinsPut` / `channelsPinsDelete`。

<a id="api-mention-get"></a>

#### mention.get — 获取 @ 提及用户

```ts
const [e] = useEvent();
const results = await sendAction({ action: 'mention.get', payload: { event: e.current } });
// results[0].data => [{ UserId, UserName, IsMaster, IsBot, UserKey }]
```

<a id="api-message-input-notify"></a>

#### message.input.notify — 输入状态通知（仅单聊）

展示“正在输入”状态，仅单聊支持；与流式消息是不同能力。

| 参数                  | 类型   | 说明                                   |
| --------------------- | ------ | -------------------------------------- |
| `UserId`              | string | 用户 openid                            |
| `params.input_type`   | number | 输入状态类型，当前固定 `1`（正在输入） |
| `params.input_second` | number | 展示时长（秒），如 `60`                |

```ts
await sendAction({
  action: 'message.input.notify',
  payload: { UserId: 'USER_OPENID', params: { input_type: 1, input_second: 60 } }
});
```

> 参考官方文档 `message/send-receive/streaming.md`：输入状态通过普通发消息接口发送 `msg_type=6` + `input_notify`。

---

### 群管理 API

> 群管理接口要求机器人拥有群管理员身份。通过 `sendAction` 调用时**推荐在 `payload` 中透传 `event`（来源事件对象）**，群 openid 与群成员 openid 由适配器自动推断（群消息事件中群 openid 位于 `ChannelId`、成员 openid 位于 `UserId`）；也可用 `payload.ChannelId` / `payload.UserId` 或 `params.groupOpenId` / `params.memberOpenId` 显式覆盖。`useClient` 直接调 SDK 时按方法签名传参。

<a id="api-group-info"></a>

#### group.info — 获取群基本信息

```ts
// 推荐：透传来源事件，群 openid 自动推断
await sendAction({ action: 'group.info', payload: { event: event.current } });
// 或显式指定群
await sendAction({ action: 'group.info', payload: { params: { groupOpenId: 'GROUP_OPENID' } } });
```

> 对应 SDK：`groupsInfo`；官方文档 `server-inter/group/manage/get-group-info.md`。

<a id="api-group-bot-state"></a>

#### group.botState — 机器人群内状态

```ts
// 透传来源事件，群 openid 自动推断
await sendAction({ action: 'group.botState', payload: { event: event.current } });
```

> 对应 SDK：`groupsBotState`；官方文档 `server-inter/group/manage/get-bot-state.md`。

<a id="api-group-member-info"></a>

#### group.member.info — 群成员详情

```ts
// 推荐：透传事件，群 openid 与成员 openid 自动推断
await sendAction({ action: 'group.member.info', payload: { event: event.current } });
// 显式指定
await sendAction({ action: 'group.member.info', payload: { params: { groupOpenId: 'GROUP_OPENID', memberOpenId: 'MEMBER_OPENID' } } });
```

> 对应 SDK：`groupsMembersMessage`；官方文档 `server-inter/group/manage/get-member.md`。

<a id="api-group-join-request-list"></a>

#### group.joinRequest.list — 拉取入群申请列表

| 参数            | 类型   | 说明                        |
| --------------- | ------ | --------------------------- |
| `params.cursor` | string | 分页游标，首次不传或传空    |
| `params.limit`  | number | 单页数量，默认 20，最大 100 |

```ts
const results = await sendAction({
  action: 'group.joinRequest.list',
  payload: { event: event.current, params: { cursor: '', limit: 20 } }
});
// results[0].data => { list: JoinRequest[], next_cursor: string }
```

> 对应 SDK：`groupsJoinRequestList`；官方文档 `server-inter/group/manage/join-request.md`。

<a id="api-group-join-request-approve"></a>

#### group.joinRequest.approve — 审批入群申请

| 参数                          | 类型    | 说明                                                             |
| ----------------------------- | ------- | ---------------------------------------------------------------- |
| `event`                       | object  | 来源事件（推荐）：群 openid / 申请人 openid 自动推断，无需显式传 |
| `ChannelId` / `UserId`        | string  | 可选，显式指定群 openid / 申请人 openid（优先级高于 event 推断） |
| `params.op`                   | string  | `approve` 通过 / `decline` 拒绝                                  |
| `params.joinRequestId`        | string  | 申请 ID（申请事件 `GROUP_JOIN_REQUEST` 中携带）                  |
| `params.rejectReason`         | string  | 拒绝理由（`op=decline` 时）                                      |
| `params.addToMemberBlacklist` | boolean | 同时加入群黑名单（`op=decline` 时）                              |

```ts
// 通过（推荐：透传事件，自动推断群 openid / 申请人 openid）
await sendAction({
  action: 'group.joinRequest.approve',
  payload: {
    event: event.current,
    params: { op: 'approve', joinRequestId: 'JOIN_REQUEST_ID' }
  }
});

// 拒绝并拉黑（显式指定目标）
await sendAction({
  action: 'group.joinRequest.approve',
  payload: {
    ChannelId: 'GROUP_OPENID',
    UserId: 'MEMBER_OPENID',
    params: { op: 'decline', joinRequestId: 'JOIN_REQUEST_ID', rejectReason: '不符合入群要求', addToMemberBlacklist: true }
  }
});
```

> 对应 SDK：`groupsApprovalJoinRequest`；官方文档 `server-inter/group/manage/join-request.md`。机器人收到 `GROUP_JOIN_REQUEST` 事件（`notice.create`）时即可调用审批。

<a id="api-group-mute-setting"></a>

#### group.mute.setting — 查询群禁言状态

```ts
const results = await sendAction({ action: 'group.mute.setting', payload: { event: event.current } });
// results[0].data => { global_rule: GlobalMuteRule, members: MemberMuteState[] }
```

> 对应 SDK：`groupsRestrictChatSetting`；官方文档 `server-inter/group/manage/mute.md`。

<a id="api-group-mute-set"></a>

#### group.mute.set — 设置群成员禁言

| 参数             | 类型                 | 说明                           |
| ---------------- | -------------------- | ------------------------------ |
| `params.members` | SetMemberMuteState[] | 禁言操作列表，单次不超过 10 个 |

`SetMemberMuteState`：`{ op: 'add' | 'update' | 'del', member_openid, mute_expire_at? }`（`mute_expire_at` 为 RFC3339 时间，`op=del` 可传空串立即解除）。

```ts
await sendAction({
  action: 'group.mute.set',
  payload: {
    params: {
      members: [{ op: 'add', member_openid: 'MEMBER_OPENID', mute_expire_at: '2026-08-05T11:23:05+08:00' }]
    }
  }
});
```

> 对应 SDK：`groupsRestrictChatSettingPost`；官方文档 `server-inter/group/manage/mute.md`。注意新增/更新禁言只能操作普通成员，不能操作群主、管理员或机器人。

<a id="api-group-strategy"></a>

#### group.strategy.\* — 入群自动审批策略

一个机器人最多创建 20 个策略，策略仅在机器人拥有对应群管理员身份时生效。

**group.strategy.list — 策略列表**

```ts
await sendAction({ action: 'group.strategy.list', payload: { params: { cursor: '', limit: 20 } } });
```

**group.strategy.create — 创建策略**

| 参数                  | 类型     | 说明                                                                   |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| `params.groupOpenIds` | string[] | 关联群 openid 列表，与 `groupIds` 二选一                               |
| `params.groupIds`     | string[] | 关联 QQ 群号列表（字符串，避免 JS 精度问题），与 `groupOpenIds` 二选一 |
| `params.isEnable`     | string   | `on` 启用 / `off` 关闭，默认 `on`                                      |
| `params.expireAt`     | string   | 过期时间（RFC3339），不传默认一年后                                    |
| `params.remark`       | string   | 备注，最多 255 字                                                      |

```ts
await sendAction({
  action: 'group.strategy.create',
  payload: { params: { groupOpenIds: ['GROUP_OPENID_1'], isEnable: 'on', remark: '白名单自动入群' } }
});
```

**group.strategy.update — 修改策略**

| 参数                                                    | 类型   | 说明                                                        |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `StrategyId`                                            | string | 策略 ID                                                     |
| `params.isEnable` / `params.expireAt` / `params.remark` | -      | 同创建                                                      |
| `params.groupAction`                                    | object | `{ op: 'add'\|'del', groupOpenIds?, groupIds? }` 关联群增删 |

**group.strategy.delete — 删除策略**

```ts
await sendAction({ action: 'group.strategy.delete', payload: { StrategyId: 'STRATEGY_ID' } });
```

**group.strategy.execute — 执行策略**

对策略关联的全部群发起全量扫描，将命中白名单号码的入群申请自动审批通过。任务异步执行，约 10 分钟完成。

```ts
await sendAction({ action: 'group.strategy.execute', payload: { StrategyId: 'STRATEGY_ID' } });
```

**group.strategy.whitelist — 修改白名单**

| 参数                    | 类型     | 说明                                                   |
| ----------------------- | -------- | ------------------------------------------------------ |
| `StrategyId`            | string   | 策略 ID                                                |
| `params.op`             | string   | `add` 新增 / `del` 删除                                |
| `params.whitelistUsers` | string[] | QQ 号码列表（字符串），单次最多 10000 个，总上限 10 万 |

```ts
await sendAction({
  action: 'group.strategy.whitelist',
  payload: { StrategyId: 'STRATEGY_ID', params: { op: 'add', whitelistUsers: ['1234567'] } }
});
```

> 对应 SDK：`groupsJoinApprovalStrategies` / `groupsJoinApprovalStrategyCreate` / `groupsJoinApprovalStrategyPatch` / `groupsJoinApprovalStrategyDelete` / `groupsJoinApprovalStrategyExecute` / `groupsJoinApprovalStrategyWhitelistUsers`；官方文档 `server-inter/group/manage/join-approval-strategy.md`。

---

### 频道（Guild）API

<a id="api-channel-info"></a>

#### channel.info — 子频道详情

```ts
await sendAction({ action: 'channel.info', payload: { ChannelId: 'CHANNEL_ID' } });
```

> 对应 SDK：`channels`。

<a id="api-channel-list"></a>

#### channel.list — 子频道列表

```ts
await sendAction({ action: 'channel.list', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guildsChannels`。

<a id="api-channel-create"></a>

#### channel.create — 创建子频道

| 参数              | 类型   | 说明             |
| ----------------- | ------ | ---------------- |
| `GuildId`         | string | 频道（服务器）id |
| `params.name`     | string | 子频道名称       |
| `params.type`     | number | 子频道类型       |
| `params.parentId` | string | 父分组 id        |

```ts
await sendAction({ action: 'channel.create', payload: { GuildId: 'GUILD_ID', params: { name: '游戏区', type: 0 } } });
```

<a id="api-channel-update"></a>

#### channel.update — 修改子频道

```ts
await sendAction({ action: 'channel.update', payload: { ChannelId: 'CHANNEL_ID', params: { name: '新名称', position: 0 } } });
```

<a id="api-channel-delete"></a>

#### channel.delete — 删除子频道

```ts
await sendAction({ action: 'channel.delete', payload: { ChannelId: 'CHANNEL_ID' } });
```

<a id="api-channel-announce"></a>

#### channel.announce — 频道公告

| 参数               | 类型    | 说明                                      |
| ------------------ | ------- | ----------------------------------------- |
| `GuildId`          | string  | 频道 id                                   |
| `params.messageId` | string  | 公告消息 id                               |
| `params.channelId` | string  | 子频道 id（消息 id 存在时必传）           |
| `params.remove`    | boolean | `true` 删除公告（`messageId='all'` 清空） |

```ts
// 创建公告
await sendAction({
  action: 'channel.announce',
  payload: { GuildId: 'GUILD_ID', params: { messageId: 'MSG_ID', channelId: 'CHANNEL_ID' } }
});
// 删除公告
await sendAction({ action: 'channel.announce', payload: { GuildId: 'GUILD_ID', params: { remove: true, messageId: 'MSG_ID' } } });
```

> 对应 SDK：`guildsAnnounces` / `guildsAnnouncesDelete`。

---

### 成员 API

> 以下均为**频道（Guild）**成员接口，群成员接口见 [群管理 API](#群管理-api)。

<a id="api-member-info"></a>

#### member.info — 成员详情

```ts
await sendAction({ action: 'member.info', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
// 或使用框架 Hook：const [member] = useMember(); await member.info({ userId: 'USER_ID' });
```

> 对应 SDK：`guildsMembersMessage`。

<a id="api-member-list"></a>

#### member.list — 成员列表

```ts
await sendAction({ action: 'member.list', payload: { GuildId: 'GUILD_ID', params: { After: '0', Limit: 100 } } });
```

> 对应 SDK：`guildsMembers`。

<a id="api-member-kick"></a>

#### member.kick — 移出成员

```ts
await sendAction({ action: 'member.kick', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
```

> 对应 SDK：`guildsMembersDelete`。

<a id="api-member-ban"></a>

#### member.ban / member.unban — 禁言 / 解除禁言

QQ 频道没有真正意义的封禁，适配器以**禁言**实现 ban：不传时长或时长小于等于 0 时默认禁言 7 天（604800 秒）。

```ts
// 禁言（默认 7 天）
await sendAction({ action: 'member.ban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
// 禁言指定时长（秒）
await sendAction({ action: 'member.ban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', params: { duration: 3600 } } });
// 解除
await sendAction({ action: 'member.unban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
```

> 对应 SDK：`guildsMemberMute`（`mute_seconds: '0'` 为解除）。

<a id="api-member-mute"></a>

#### member.mute — 成员禁言（指定时长）

```ts
await sendAction({ action: 'member.mute', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', params: { duration: 600 } } });
```

---

### 服务器（Guild）API

<a id="api-guild-info"></a>

#### guild.info — 频道详情

```ts
await sendAction({ action: 'guild.info', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guilds`。

<a id="api-guild-list"></a>

#### guild.list — 机器人频道列表

```ts
const results = await sendAction({ action: 'guild.list' });
```

> 对应 SDK：`usersMeGuilds`。

<a id="api-guild-mute"></a>

#### guild.mute — 全员禁言

```ts
// 全员禁言（秒）
await sendAction({ action: 'guild.mute', payload: { GuildId: 'GUILD_ID', params: { duration: 600 } } });
// duration 为 0 时解除
await sendAction({ action: 'guild.mute', payload: { GuildId: 'GUILD_ID', params: { duration: 0 } } });
```

> 对应 SDK：`guildsMuteAll`。

---

### 角色 API

<a id="api-role-list"></a>

#### role.list — 身份组列表

```ts
await sendAction({ action: 'role.list', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guildsRoles`。

<a id="api-role-create"></a>

#### role.create — 创建身份组

```ts
await sendAction({ action: 'role.create', payload: { GuildId: 'GUILD_ID', params: { name: '管理员', color: 4278190080 } } });
```

> `color` 为 ARGB HEX 转换后的十进制数值。

<a id="api-role-update"></a>

#### role.update — 修改身份组

```ts
await sendAction({ action: 'role.update', payload: { GuildId: 'GUILD_ID', RoleId: 'ROLE_ID', params: { name: '新名称' } } });
```

<a id="api-role-delete"></a>

#### role.delete — 删除身份组

```ts
await sendAction({ action: 'role.delete', payload: { GuildId: 'GUILD_ID', RoleId: 'ROLE_ID' } });
```

<a id="api-role-assign"></a>

#### role.assign / role.remove — 分配 / 移除成员身份组

```ts
await sendAction({ action: 'role.assign', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', RoleId: 'ROLE_ID' } });
await sendAction({ action: 'role.remove', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', RoleId: 'ROLE_ID' } });
```

> 对应 SDK：`guildsRolesMembersPut` / `guildsRolesMembersDelete`（QQ Bot 的 channel_id 传空字符串使用默认）。

---

### 媒体 / 文件 / 上传 API

<a id="api-media-send-user"></a>

#### media.send.user — 发送富媒体到用户

| 参数          | 类型   | 说明                                 |
| ------------- | ------ | ------------------------------------ |
| `UserId`      | string | 用户 openid                          |
| `params.type` | string | `image` / `video` / `audio` / `file` |
| `params.url`  | string | 文件 URL                             |
| `params.data` | string | base64 文件数据                      |

```ts
await sendAction({
  action: 'media.send.user',
  payload: { UserId: 'USER_OPENID', params: { type: 'image', url: 'https://example.com/a.png' } }
});
```

> 对应 SDK：`postRichMediaByUser`。`media.send.channel` 当前不支持（QQ 频道无独立媒体发送接口，请改用 `message.send` 携带图片）；`media.upload` 不支持纯上传。

<a id="api-media-upload-prepare"></a>

#### media.upload.prepare — 分片上传准备

| 参数                 | 类型              | 说明                                                      |
| -------------------- | ----------------- | --------------------------------------------------------- |
| `UserId` / `GroupId` | string            | 用户 openid 或群 openid（二选一，优先 UserId）            |
| `params`             | UploadPrepareData | `{ file_type, file_name, file_size, md5, sha1, md5_10m }` |

```ts
await sendAction({
  action: 'media.upload.prepare',
  payload: { UserId: 'USER_OPENID', params: { file_type: 4, file_name: 'a.zip', file_size: '1024', md5: '...', sha1: '...', md5_10m: '...' } }
});
```

> `md5_10m` 为文件前 `10002432` 字节（约 10MB）的 MD5。文件软限制：图片 20MB / 视频 30MB / 语音 20MB / 文件 200MB，超软限制降级为文件类型，超 200MB 报错。

<a id="api-media-upload-part-finish"></a>

#### media.upload.part.finish — 分片完成上报

| 参数                 | 类型                 | 说明                                         |
| -------------------- | -------------------- | -------------------------------------------- |
| `UserId` / `GroupId` | string               | 用户 / 群 openid                             |
| `params`             | UploadPartFinishData | `{ upload_id, part_index, block_size, md5 }` |

<a id="api-media-upload-chunked"></a>

#### media.upload.chunked — 分片上传全流程（推荐）

自动编排完整流程：`upload_prepare` 拿 `upload_id` 与每片 `presigned_url` → 分片字节 PUT 直传 COS → 每片成功上报 `upload_part_finish` → 全部完成后合并得到 `file_info`。

| 参数                                | 类型             | 说明                              |
| ----------------------------------- | ---------------- | --------------------------------- |
| `UserId` / `GroupId`                | string           | 用户 / 群 openid                  |
| `params.file` 或 `params.file_path` | string \| Buffer | 本地文件路径或文件内容            |
| `params.file_type`                  | number           | 1 图片 / 2 视频 / 3 语音 / 4 文件 |
| `params.file_name`                  | string           | 文件名（可选）                    |
| `params.srv_send_msg`               | boolean          | 是否合并后直接发送（可选）        |

```ts
await sendAction({
  action: 'media.upload.chunked',
  payload: { GroupId: 'GROUP_OPENID', params: { file: 'D:/a.zip', file_type: 4, file_name: 'a.zip' } }
});
```

> 发送消息时 `postRichMediaByUser` / `postRichMediaByGroup` 传入的 `file_data` 超过 10MB 也会自动走此流程。官方文档 `message/send-receive/chunked-upload.md`。

<a id="api-file-send"></a>

#### file.send.channel / file.send.user — 发送文件

```ts
// 向群发送
await sendAction({
  action: 'file.send.channel',
  payload: { ChannelId: 'GROUP_OPENID', params: { file_type: 4, url: 'https://example.com/a.zip', srv_send_msg: true } }
});
// 向用户发送
await sendAction({
  action: 'file.send.user',
  payload: { UserId: 'USER_OPENID', params: { file_type: 4, url: 'https://example.com/a.zip' } }
});
```

<a id="api-stream-message-send"></a>

#### stream.message.send — 单聊流式消息

持续更新同一条回复：首次请求创建，后续请求带 `stream_msg_id` 更新，最后一包 `input_state: 10` 结束。

| 参数                                | 类型   | 说明                                                |
| ----------------------------------- | ------ | --------------------------------------------------- |
| `UserId`                            | string | 用户 openid（仅单聊）                               |
| `params.input_mode`                 | string | `append` 追加（默认）/ `replace` 替换（传全量正文） |
| `params.input_state`                | number | `1` 生成中 / `10` 生成结束                          |
| `params.content_type`               | string | `text` / `markdown`                                 |
| `params.content_raw`                | string | 当前展示内容                                        |
| `params.msg_id` / `params.event_id` | string | 被动回复标识，二选一                                |
| `params.msg_seq`                    | number | 去重序号，同一条内保持一致                          |
| `params.index`                      | number | 分片序号，从 0 递增                                 |
| `params.stream_msg_id`              | string | 首次响应返回的 `id`，后续请求携带                   |

```ts
// 首次
await sendAction({
  action: 'stream.message.send',
  payload: { UserId: 'USER_OPENID', params: { input_mode: 'replace', input_state: 1, content_type: 'text', content_raw: '正在分析...', msg_seq: 1, index: 0 } }
});
// 后续
await sendAction({
  action: 'stream.message.send',
  payload: {
    UserId: 'USER_OPENID',
    params: {
      input_mode: 'replace',
      input_state: 1,
      content_type: 'text',
      content_raw: '正在分析，已找到资料...',
      msg_seq: 1,
      index: 1,
      stream_msg_id: 'STREAM_MSG_ID'
    }
  }
});
// 结束
await sendAction({
  action: 'stream.message.send',
  payload: {
    UserId: 'USER_OPENID',
    params: { input_mode: 'replace', input_state: 10, content_type: 'text', content_raw: '结论：...', msg_seq: 1, index: 2, stream_msg_id: 'STREAM_MSG_ID' }
  }
});
```

> 官方文档 `message/send-receive/streaming.md`。`replace` 模式不允许修改已下发内容前缀（错误码 40007）。

---

### 表情 / 权限 / 交互 API

<a id="api-reaction-add"></a>

#### reaction.add / reaction.remove — 表情表态

| 参数        | 类型   | 说明      |
| ----------- | ------ | --------- |
| `ChannelId` | string | 子频道 id |
| `MessageId` | string | 消息 ID   |
| `EmojiId`   | string | 表情 id   |

```ts
await sendAction({ action: 'reaction.add', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106' } });
await sendAction({ action: 'reaction.remove', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106' } });
```

> 对应 SDK：`channelsMessagesReactionsPut` / `channelsMessagesReactionsDelete`（type 固定 `1` 系统表情）。

<a id="api-reaction-list"></a>

#### reaction.list — 表情表态用户列表

```ts
const results = await sendAction({
  action: 'reaction.list',
  payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106', params: { limit: 20 } }
});
```

> 对应 SDK：`channelsMessagesReactionsUsers`。

<a id="api-permission"></a>

#### permission.get / permission.set — 子频道用户权限

```ts
await sendAction({ action: 'permission.get', payload: { ChannelId: 'CHANNEL_ID', UserId: 'USER_ID' } });
// allow / deny 为权限位字符串，同一位同时为 1 时表现为删除权限
await sendAction({ action: 'permission.set', payload: { ChannelId: 'CHANNEL_ID', UserId: 'USER_ID', params: { allow: '1', deny: '0' } } });
```

> 对应 SDK：`channelsPermissions` / `channelsPermissionsPut`。

<a id="api-interaction-response"></a>

#### interaction.response — 互动事件回应

回应互动事件，解除客户端按钮 loading。收到 `INTERACTION_CREATE` 事件时适配器已自动调用（code 0），一般无需手动调用。

```ts
await sendAction({ action: 'interaction.response', payload: { interaction_id: 'INTERACTION_ID', code: 0 } });
```

> 对应 SDK：`interactionResponse`。互动按钮需 3 秒内响应。

<a id="api-me-info"></a>

#### me.info — 机器人自身信息

```ts
const results = await sendAction({ action: 'me.info' });
// results[0].data => { UserId, UserName, UserAvatar, IsBot: true, ... }
```

> 对应 SDK：`usersMe`。

<a id="api-me-guilds"></a>

#### me.guilds — 机器人频道列表

```ts
const results = await sendAction({ action: 'me.guilds' });
```

> 对应 SDK：`usersMeGuilds`。

---

## SDK 方法速查

通过 `useClient(event)` 可直接调用 `QQBotAPI` 全部方法（跳过 Action 层，返回原始接口数据）：

```ts
// src/response/info.ts
import { useClient, useEvent, useMessage, Format } from 'alemonjs';
import { API, platform } from '@alemonjs/qq-bot';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  if (event.current.Platform !== platform) return;

  const [client] = useClient(API);
  const res = await client.groupsInfo('GROUP_OPENID'); // 原始返回

  await message.send({ format: Format.create().addText(JSON.stringify(res)) });
};
```

| 分类     | SDK 方法                                                                                                                                                                                                                        | 说明                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 鉴权     | `getAuthentication` / `gateway`                                                                                                                                                                                                 | 获取 access_token / 网关地址       |
| 单聊     | `usersOpenMessages`                                                                                                                                                                                                             | 发送单聊消息（msg_type 0/2/3/6/7） |
| 单聊     | `userMessageDelete`                                                                                                                                                                                                             | 撤回单聊消息                       |
| 单聊     | `postRichMediaByUser`                                                                                                                                                                                                           | 发送单聊富媒体（超 10MB 自动分片） |
| 单聊     | `streamMessages`                                                                                                                                                                                                                | 流式消息                           |
| 群聊     | `groupOpenMessages`                                                                                                                                                                                                             | 发送群聊消息                       |
| 群聊     | `groupMessageDelete`                                                                                                                                                                                                            | 撤回群消息                         |
| 群聊     | `postRichMediaByGroup`                                                                                                                                                                                                          | 发送群聊富媒体                     |
| 群管理   | `groupsInfo` / `groupsBotState` / `groupsMembersMessage`                                                                                                                                                                        | 群信息 / 状态 / 成员               |
| 群管理   | `groupsJoinRequestList` / `groupsApprovalJoinRequest`                                                                                                                                                                           | 入群申请列表 / 审批                |
| 群管理   | `groupsRestrictChatSetting` / `groupsRestrictChatSettingPost`                                                                                                                                                                   | 禁言查询 / 设置                    |
| 群管理   | `groupsJoinApprovalStrategies` / `groupsJoinApprovalStrategyCreate` / `groupsJoinApprovalStrategyPatch` / `groupsJoinApprovalStrategyDelete` / `groupsJoinApprovalStrategyExecute` / `groupsJoinApprovalStrategyWhitelistUsers` | 入群自动审批策略                   |
| 分片上传 | `usersUploadPrepare` / `groupUploadPrepare` / `usersUploadPartFinish` / `groupUploadPartFinish` / `uploadPartDirect`                                                                                                            | 分片上传各环节                     |
| 频道     | `guilds` / `guildsChannels` / `channels` / `guildsChannelsCreate` / `guildsChannelsUpdate` / `guildsChannelsdelete`                                                                                                             | 频道与子频道管理                   |
| 频道消息 | `channelsMessages` / `channelsMessagesById` / `channelsMessagesDelete` / `dmsMessages` / `dmsMessageDelete`                                                                                                                     | 频道消息收发                       |
| 成员     | `guildsMembers` / `guildsMembersMessage` / `guildsMembersDelete` / `guildsRolesMembers`                                                                                                                                         | 成员管理                           |
| 禁言     | `guildsMuteAll` / `guildsMute` / `guildsMemberMute`                                                                                                                                                                             | 全员 / 批量 / 成员禁言             |
| 角色     | `guildsRoles` / `guildsRolesPost` / `guildsRolesPatch` / `guildsRolesDelete` / `guildsRolesMembersPut` / `guildsRolesMembersDelete`                                                                                             | 身份组管理                         |
| 权限     | `channelsPermissions` / `channelsPermissionsPut`                                                                                                                                                                                | 子频道权限                         |
| 表情     | `channelsMessagesReactionsPut` / `channelsMessagesReactionsDelete` / `channelsMessagesReactionsUsers`                                                                                                                           | 表情表态                           |
| 公告     | `guildsAnnounces` / `guildsAnnouncesDelete`                                                                                                                                                                                     | 频道公告                           |
| 精华     | `channelsPinsPut` / `channelsPinsDelete` / `channelsPins`                                                                                                                                                                       | 精华消息                           |
| 日程     | `channelsSchedules` / `channelsSchedulesSchedule` / `channelsSchedulesPost` / `channelsSchedulesSchedulePatch` / `channelsSchedulesScheduleDelete`                                                                              | 频道日程                           |
| 音频     | `channelsAudioPost` / `channelsMicPut` / `channelsMicDelete`                                                                                                                                                                    | 音频控制 / 上下麦                  |
| 帖子     | `channelsThreads` / `channelsThreadsThread` / `channelsThreadsPut` / `channelsThreadsDelete`                                                                                                                                    | 论坛帖子                           |
| 其他     | `usersMe` / `usersMeGuilds` / `usersMeDms` / `interactionResponse`                                                                                                                                                              | 机器人信息 / 私信会话 / 互动回应   |

---

## 事件支持

适配器将 QQ 事件转换为 alemonjs 标准事件，开发时通过 `Router` DSL / `useEvent` 订阅。

各事件对应的数据结构与读取方法见 [事件数据结构](#事件数据结构)，快捷跳转：

| 分类                                | 跳转                                      |
| ----------------------------------- | ----------------------------------------- |
| 消息事件（群 / 单聊 / 频道 / 私信） | [原始数据结构](#event-data-message)       |
| 互动按钮                            | [互动按钮事件](#event-data-interaction)   |
| 入群申请 / 成员 / 好友              | [群管理·成员·好友事件](#event-data-group) |
| 频道事件                            | [频道事件](#event-data-guild)             |
| 字段读取 / @ 提及 / 按场景回复      | [数据使用方法](#event-data-usage)         |

| QQ 事件                                                                                  | 标准事件                                               | 场景                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- |
| `GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE`                                       | `message.create`                                       | 群消息 / 群 @              |
| `AT_MESSAGE_CREATE` / `MESSAGE_CREATE`                                                   | `message.create`                                       | 频道 @ / 私域全量消息      |
| `C2C_MESSAGE_CREATE`                                                                     | `private.message.create`                               | 单聊                       |
| `DIRECT_MESSAGE_CREATE`                                                                  | `private.message.create`                               | 频道私信                   |
| `INTERACTION_CREATE`                                                                     | `interaction.create` / `private.interaction.create`    | 互动按钮（群/单聊/频道）   |
| `MESSAGE_DELETE` / `PUBLIC_MESSAGE_DELETE`                                               | `message.delete`                                       | 频道消息撤回               |
| `DIRECT_MESSAGE_DELETE`                                                                  | `private.message.delete`                               | 私信撤回                   |
| `GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`                                               | `member.add` / `member.remove`                         | 群成员变动                 |
| `GUILD_MEMBER_ADD` / `GUILD_MEMBER_REMOVE` / `GUILD_MEMBER_UPDATE`                       | `member.add` / `member.remove` / `member.update`       | 频道成员变动               |
| `GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT`                                                    | `guild.join` / `guild.exit`                            | 机器人入群 / 退群          |
| `GUILD_CREATE` / `GUILD_DELETE` / `GUILD_UPDATE`                                         | `guild.join` / `guild.exit` / `guild.update`           | 机器人加入/退出/频道更新   |
| `CHANNEL_CREATE` / `CHANNEL_DELETE` / `CHANNEL_UPDATE`                                   | `channel.create` / `channel.delete` / `channel.update` | 子频道变动                 |
| `MESSAGE_REACTION_ADD` / `MESSAGE_REACTION_REMOVE`                                       | `message.reaction.add` / `message.reaction.remove`     | 表情表态                   |
| `FRIEND_ADD` / `FRIEND_DEL`                                                              | `private.friend.add` / `private.friend.remove`         | 好友添加 / 删除            |
| `GROUP_JOIN_REQUEST`                                                                     | `notice.create`                                        | 用户申请加群（需群管理员） |
| `GROUP_MSG_RECEIVE` / `GROUP_MSG_REJECT` / `MESSAGE_AUDIT_PASS` / `MESSAGE_AUDIT_REJECT` | `notice.create`                                        | 群推送开关 / 消息审核      |
| `C2C_MSG_RECEIVE` / `C2C_MSG_REJECT`                                                     | `private.notice.create`                                | 单聊推送开关               |
| `ERROR`                                                                                  | -                                                      | 连接 / 事件处理错误        |

示例：监听入群申请事件

```ts
// src/index.ts —— 注册纯事件订阅（非命令，使用 router.res）
import { Router, defineChildren } from 'alemonjs';

const router = Router.create({ events: ['notice.create'] });

router.res({ events: ['notice.create'] }, () => import('./response/group-join-request'));

export default defineChildren({
  register() {
    return { responseRouter: router.define };
  }
});
```

```ts
// src/response/group-join-request.ts
import { useEvent, sendAction } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  // value 为原始 QQ 事件：携带 group_openid / join_request_id / member_openid / username 等
  const value = event.value;

  // notice.create 下通过 _tag 区分具体事件
  if (event.current._tag === 'GROUP_JOIN_REQUEST') {
    // 结合 group.joinRequest.approve 审批（透传事件，群 openid / 申请人 openid 自动推断）
    await sendAction({
      action: 'group.joinRequest.approve',
      payload: {
        event: event.current,
        params: { op: 'approve', joinRequestId: value.join_request_id }
      }
    });
  }
};
```

---

## 事件数据结构

事件经过适配器转换为 alemonjs 标准事件后，统一包含两层数据：**标准字段**（框架约定，各平台一致）与 **`value` 原始数据**（QQ 平台推送的原样 payload）。以下结构均依据适配器 `src/register.ts` 与 `src/message/*` 类型定义整理。

### 统一标准字段

| 字段                      | 类型    | 说明                                                                                                           |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `name`                    | string  | 标准事件名：`message.create`、`private.message.create`、`interaction.create`、`member.add`、`notice.create` 等 |
| `value`                   | object  | **原始 QQ 事件**（WebSocket 推送的 `d` 数据），各场景结构见下                                                  |
| `_tag`                    | string  | 来源 QQ 事件名，如 `GROUP_AT_MESSAGE_CREATE`、`GROUP_JOIN_REQUEST`（`.add({ tag })` 存储为 `_tag`）            |
| `Platform`                | string  | `'qq-bot'`                                                                                                     |
| `BotId`                   | string  | 机器人 app_id                                                                                                  |
| `GuildId`                 | string  | 群 openid 或频道 id（群场景即群 openid）                                                                       |
| `SpaceId`                 | string  | 空间标识：`GROUP:{group_openid}` / `GUILD:{channel_id}`                                                        |
| `ChannelId`               | string  | 群 openid 或子频道 id                                                                                          |
| `UserId` / `UserKey`      | string  | 发送者 ID 与框架生成的用户 Key                                                                                 |
| `UserName` / `UserAvatar` | string  | 昵称 / 头像 URL                                                                                                |
| `IsMaster` / `IsBot`      | boolean | 是否主人 / 是否机器人                                                                                          |
| `MessageId`               | string  | 消息 ID（入群申请为拼接 ID）                                                                                   |
| `MessageText`             | string  | 消息文本（已去除 @ 占位符）                                                                                    |
| `OpenId`                  | string  | 回复标识：`C2C:{user_openid}` / `DIRECT:{guild_id}`                                                            |
| `IsAtMe` / `IsPrivate`    | boolean | 是否 @ 机器人 / 是否私聊                                                                                       |
| `Timestamp`               | number  | 框架自动注入的事件创建时间                                                                                     |

### 场景标识规则

| 场景           | `SpaceId`              | `OpenId`                    | `_tag` 示例                                        |
| -------------- | ---------------------- | --------------------------- | -------------------------------------------------- |
| 群聊           | `GROUP:{group_openid}` | `C2C:{member_openid}`       | `GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE` |
| 单聊（C2C）    | 无                     | `C2C:{user_openid}`         | `C2C_MESSAGE_CREATE`                               |
| 频道           | `GUILD:{channel_id}`   | `DIRECT:{guild_id}`         | `AT_MESSAGE_CREATE` / `MESSAGE_CREATE`             |
| 频道私信       | 无                     | `DIRECT:{guild_id}`         | `DIRECT_MESSAGE_CREATE`                            |
| 互动按钮（群） | `GROUP:{group_openid}` | `C2C:{group_member_openid}` | `INTERACTION_CREATE_GROUP`                         |

<a id="event-data-message"></a>

### 消息事件原始数据（`value`）

#### 群消息（`GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本（含 @ 占位符）",
  "group_openid": "群 OpenID",
  "group_id": "QQ 群号",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "message_scene": { "ext": [], "source": "" },
  "message_type": 0,
  "author": {
    "id": "发送者 ID",
    "member_openid": "群成员 OpenID",
    "union_openid": "统一标识",
    "username": "昵称",
    "bot": false
  },
  "mentions": [{ "id": "@目标 ID", "username": "昵称", "is_you": true, "member_openid": "..." }]
}
```

> 两个事件结构一致，区别仅在 `_tag` 与 `IsAtMe`：`GROUP_AT_MESSAGE_CREATE` 为群内 @ 机器人触发，`IsAtMe: true`；`GROUP_MESSAGE_CREATE` 为群内任意消息（需订阅全量推送）。

#### 单聊消息（`C2C_MESSAGE_CREATE` → `private.message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "发送者 ID", "user_openid": "用户 OpenID", "username": "昵称" }
}
```

#### 频道消息（`AT_MESSAGE_CREATE` 公域 @ / `MESSAGE_CREATE` 私域全量 → `message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本（含 @ 占位符）",
  "guild_id": "频道 ID",
  "channel_id": "子频道 ID",
  "seq": 1,
  "seq_in_channel": "1",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "用户 ID", "username": "昵称", "avatar": "头像", "bot": false },
  "mentions": [{ "id": "@目标 ID", "username": "昵称", "avatar": "头像", "bot": false }],
  "member": { "joined_at": "", "nick": "", "roles": [] },
  "attachments": [{ "id": "", "url": "", "content_type": "", "filename": "", "size": 0, "width": 0, "height": 0 }]
}
```

#### 频道私信（`DIRECT_MESSAGE_CREATE` → `private.message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本",
  "guild_id": "私信会话 ID",
  "src_guild_id": "来源频道 ID",
  "channel_id": "子频道 ID",
  "direct_message": true,
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "用户 ID", "username": "昵称", "avatar": "头像", "bot": false },
  "member": { "joined_at": "" },
  "attachments": []
}
```

<a id="event-data-interaction"></a>

### 互动按钮事件（`INTERACTION_CREATE`）

点击按钮触发，`data.resolved.button_data` 即按钮构造时传入的 `data`。分三种场景（`scene` 字段区分）：

| `scene`   | 标准事件                                                       | 关键字段                                                                                                   |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `'group'` | `interaction.create`（`_tag: INTERACTION_CREATE_GROUP`）       | `group_openid`、`group_member_openid`、`data.resolved.button_data`                                         |
| `'c2c'`   | `private.interaction.create`（`_tag: INTERACTION_CREATE_C2C`） | `user_openid`、`data.resolved.button_data`                                                                 |
| `'guild'` | `interaction.create`（`_tag: INTERACTION_CREATE_GUILD`）       | `guild_id`、`channel_id`、`data.resolved.user_id`、`data.resolved.message_id`、`data.resolved.button_data` |

```jsonc
{
  "id": "互动 ID",
  "scene": "group", // group | c2c | guild
  "chat_type": 1, // 1 群 / 2 私聊 / 0 频道
  "type": 11, // 按钮交互
  "version": 1,
  "group_openid": "群 OpenID",
  "group_member_openid": "点击者 OpenID",
  "data": {
    "type": 11,
    "resolved": { "button_data": "按钮 data", "button_id": 1 }
  }
}
```

> 适配器收到互动事件后会自动 `interactionResponse` 回应（解除按钮 loading），无需手动处理。

<a id="event-data-group"></a>

### 群管理 / 成员 / 好友事件

| 事件                                                        | 标准事件                                       | 原始数据关键字段                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GROUP_JOIN_REQUEST`（用户申请加群）                        | `notice.create`                                | `group_openid`、`join_request_id`、`member_openid`、`username`、`apply_at`、`apply_source`、`verify_info`、`auto_approved` |
| `GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`（成员进/退群）   | `member.add` / `member.remove`                 | `group_openid`、`member_openid`、`op_member_openid`、`username`                                                            |
| `GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT`（机器人进/退群）      | `guild.join` / `guild.exit`                    | `group_openid`、`op_member_openid`、`timestamp`                                                                            |
| `FRIEND_ADD` / `FRIEND_DEL`（好友添加/删除）                | `private.friend.add` / `private.friend.remove` | `openid`、`timestamp`                                                                                                      |
| `GROUP_MSG_RECEIVE` / `GROUP_MSG_REJECT`（群推送开关）      | `notice.create`                                | `group_openid`、`op_member_openid`、`timestamp`                                                                            |
| `MESSAGE_AUDIT_PASS` / `MESSAGE_AUDIT_REJECT`（群消息审核） | `notice.create`                                | `group_openid`、`message_id`、`audit_time`                                                                                 |

入群申请 `GROUP_JOIN_REQUEST` 完整字段：

```jsonc
{
  "group_openid": "群 OpenID",
  "join_request_id": "申请 ID（审批回传）",
  "member_openid": "申请人 OpenID",
  "username": "申请人昵称",
  "apply_at": "2026-08-05T17:32:52+08:00",
  "apply_source": "self_apply", // self_apply 主动 / invited 被邀请
  "risk_tips": "",
  "union_openid": "",
  "invited_by": "",
  "bot": false,
  "verify_info": { "method": "verify_message", "verify_message": "验证消息", "review_qa_list": [] },
  "auto_approved": { "strategy_id": "st_xxx" } // 仅自动审批通过事件携带
}
```

<a id="event-data-guild"></a>

### 频道事件

| 事件                                                               | 标准事件                                               | 原始数据关键字段                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `GUILD_CREATE`（机器人加入频道）                                   | `guild.join`                                           | `id`、`name`、`op_user_id`、`owner_id`、`member_count`、`max_members`       |
| `GUILD_DELETE`（机器人退出频道）                                   | `guild.exit`                                           | `id`、`op_user_id`                                                          |
| `GUILD_UPDATE`（频道信息更新）                                     | `guild.update`                                         | `id`、`name`                                                                |
| `GUILD_MEMBER_ADD` / `GUILD_MEMBER_REMOVE` / `GUILD_MEMBER_UPDATE` | `member.add` / `member.remove` / `member.update`       | `guild_id`、`user{id, username, avatar, bot}`、`nick`、`roles`、`joined_at` |
| `CHANNEL_CREATE` / `CHANNEL_DELETE` / `CHANNEL_UPDATE`             | `channel.create` / `channel.delete` / `channel.update` | `guild_id`、`id`、`name`、`type`、`parent_id`                               |
| `MESSAGE_REACTION_ADD` / `MESSAGE_REACTION_REMOVE`                 | `message.reaction.add` / `message.reaction.remove`     | `guild_id`、`channel_id`、`target{id}`、`emoji{id, type}`、`user_id`        |

<a id="event-data-usage"></a>

### 数据使用方法

#### 读取标准字段与原始数据

```ts
// src/response/read-data.ts —— 群消息事件处理
import { useEvent, useMessage, Format } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  const current = event.current; // 标准字段
  const value = event.value; // 原始 QQ 数据

  const tag = current._tag; // 'GROUP_AT_MESSAGE_CREATE' | 'GROUP_MESSAGE_CREATE' | ...
  const groupId = current.GuildId; // 群 openid
  const userId = current.UserId; // 发送者 id
  const msg = current.MessageText; // 文本（已去 @）
  const isMaster = current.IsMaster; // 是否主人

  // 原始数据补充信息（标准字段未覆盖的）
  const groupNo = value.group_id; // QQ 群号
  const memberOpenId = value.author.member_openid;
  const atMe = value.mentions?.some(m => m.is_you); // 是否 @ 机器人

  if (isMaster) {
    await message.send({ format: Format.create().addText(`主人说：${msg}`) });
  }
};
```

#### 区分子事件类型

`notice.create` / `message.create` 等标准事件可能由多个 QQ 事件转换而来，通过 `_tag` 区分：

```ts
const tag = event.current._tag;

if (tag === 'GROUP_JOIN_REQUEST') {
  // 入群申请
} else if (tag === 'MESSAGE_AUDIT_PASS') {
  // 群消息审核通过
}
```

#### 读取 @ 提及用户

```ts
import { useMention } from 'alemonjs';

export default async () => {
  const [mention] = useMention();

  const all = await mention.find(); // 全部提及
  const one = await mention.findOne({ IsBot: false }); // 第一个非机器人
  // each => { UserId, UserKey, UserName, IsMaster, IsBot }
};
```

#### 按场景回复

标准字段里的 `SpaceId` / `OpenId` 可直接用于主动发送（`MessageDirect`），无需手动解析：

```ts
// 群消息 → 回同群
await MessageDirect.create().sendToChannel({
  SpaceId: event.current.SpaceId, // 'GROUP:{group_openid}'
  format: Format.create().addText('收到')
});
// 单聊消息 → 回同用户
await MessageDirect.create().sendToUser({
  OpenID: event.current.OpenId, // 'C2C:{user_openid}'
  format: Format.create().addText('收到')
});
```

---

## 常见问题

**1. Webhook 模式无法收到事件？**

- 需公网 ip/域名，且官方平台配置的回调地址与 `route`/`port` 一致；
- Webhook 启用后官方会禁用 WebSocket 模式。

**2. 发送 Markdown 报错 / 不渲染？**

- 需要平台开通 Markdown 消息权限；未开通可在配置中开启 `markdownToText: true` 降级为纯文本。

**3. 图片 / 视频 / 语音 / 文件发送失败？**

- 富媒体有软限制（图片 20MB / 视频 30MB / 语音 20MB / 文件 200MB），超软限制自动降级为文件类型，超 200MB 硬限制报错；
- 大于 10MB 的文件自动走分片上传流程（`media.upload.chunked`）；
- 文件格式需符合要求（视频 mp4、语音 silk）；文件发送能力以平台开放为准，失败时会降级为 `[附件]` 文本。

**4. `member.ban` 与 `member.mute` 的区别？**

- QQ 频道无封禁能力，`member.ban` 使用禁言实现（默认 7 天）；`member.mute` 按传入 `duration` 秒数禁言。

**5. 群管理接口报权限错误？**

- 机器人需拥有对应群的**管理员身份**；入群自动审批策略最多创建 20 个。

**6. `group.joinRequest.approve` 需要哪些参数？**

- 推荐在 `payload` 中透传 `event`（来源事件对象），群 openid / 申请人 openid 由适配器自动推断（群消息事件中群 openid 位于 `ChannelId`、成员 openid 位于 `UserId`）；也可用 `payload.ChannelId` / `payload.UserId` 或 `params.groupOpenId` / `params.memberOpenId` 显式指定（优先级更高）；
- `joinRequestId` 从 `GROUP_JOIN_REQUEST` 事件（`notice.create`）携带的 `join_request_id` 获取。

**7. 扫码登录后，原来在别处运行的机器人掉线了？**

- 扫码授权会**重置机器人的 AppSecret，旧密钥失效**，旧实例自然无法继续鉴权；将旧实例的 `secret` 更新为扫码后写入配置的新密钥即可恢复，详见 [扫码登录](#扫码登录)。
