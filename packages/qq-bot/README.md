# @alemonjs/qq-bot

## 项目作用

AlemonJS 的 QQ 开放平台适配器，用于连接官方机器人接口，将 QQ 消息、事件和操作接入框架 Hook。

- 支持群聊、单聊、频道、频道私信和互动按钮。
- 支持文本、图片、Markdown、按钮、Ark 卡片及音视频、文件消息。
- 提供群管理、媒体上传和单聊流式消息能力；具体能力以平台权限为准。
- 支持 WebSocket、Webhook 连接，以及 WebSocket 多机器人配置。

## 配置

### 基础配置

在项目的 `alemon.config.yaml` 中填写：

```yaml
qq-bot:
  app_id: 'YOUR_APP_ID'
  secret: 'YOUR_APP_SECRET'
```

`app_id` 和 `secret` 可在 [QQ 开放平台](https://q.qq.com/) 获取。默认使用 WebSocket；未填写凭证且未配置 `bots` 时，会进入[扫码登录](./QR_LOGIN.md)。扫码授权会重置 AppSecret，使旧密钥失效。

### 连接模式

| 模式              | 配置方式                                | 说明                                                            |
| ----------------- | --------------------------------------- | --------------------------------------------------------------- |
| WebSocket（默认） | 不配置 `route`、`port`、`ws`            | 直连官方网关                                                    |
| Webhook           | 配置 `route` 或 `port`                  | 本地服务接收回调，需要公网地址；启用后官方会禁用 WebSocket 模式 |
| Webhook 转发      | 配置 `ws`                               | 连接已有的 Webhook 转发服务                                     |
| 自定义网关        | 配置 `gatewayURL` 或 `base_url_gateway` | 使用自建网关或域名代理                                          |

Webhook 配置示例（需自行填写完整凭证，不触发扫码登录）：

```yaml
qq-bot:
  app_id: 'YOUR_APP_ID'
  secret: 'YOUR_APP_SECRET'
  port: '17157'
  route: '/webhook'
```

### 多机器人（WebSocket）

`bots` 的键为 BotId/AppID，每项填写对应密钥，可覆盖公共 SDK 配置。配置多个机器人时必须设置 `default_bot`，其值须匹配 `bots` 中的键。事件回复自动使用事件所属机器人，主动操作可通过 `BotId` 指定机器人。

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

| 配置项                      | 类型             | 默认值          | 说明                                                                                      |
| --------------------------- | ---------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `app_id`                    | string           | —               | 单机器人 AppID；可通过扫码自动写入                                                        |
| `secret`                    | string           | —               | AppSecret；Webhook 模式同时用于签名                                                       |
| `bots`                      | object           | —               | 多机器人配置，键为 BotId/AppID，仅用于 WebSocket                                          |
| `default_bot`               | string           | 单个机器人的 ID | 默认机器人，配置多个机器人时必填                                                          |
| `master_key`                | string[]         | `[]`            | 主人 UserKey 列表                                                                         |
| `master_id`                 | string[]         | `[]`            | 主人 UserId 列表                                                                          |
| `route`                     | string           | `/webhook`      | Webhook 回调路由；显式配置后启用 Webhook                                                  |
| `port`                      | string           | `17157`         | Webhook 本地监听端口；显式配置后启用 Webhook                                              |
| `ws`                        | string           | —               | 已有 Webhook 转发服务的 WebSocket 地址                                                    |
| `gatewayURL`                | string           | —               | 自定义 WebSocket 网关地址                                                                 |
| `base_url_gateway`          | string           | —               | 网关域名代理                                                                              |
| `base_url_app_access_token` | string           | —               | 获取 access_token 的域名代理                                                              |
| `is_private`                | boolean          | `false`         | 私域机器人，影响默认事件订阅                                                              |
| `sandbox`                   | boolean          | `false`         | 使用沙盒 API 环境                                                                         |
| `shard`                     | number[]         | `[0, 1]`        | WebSocket 分片                                                                            |
| `intents`                   | string[]         | 自动组装        | 自定义事件订阅，覆盖默认值，见 [intents.ts](./src/sdk/intents.ts)；通常省略，不要填空数组 |
| `autoInteractionAck`        | boolean          | `true`          | 自动确认按钮、快捷菜单事件；关闭后由应用调用 `useInteraction().ack()`                     |
| `markdownToText`            | boolean          | `false`         | 将 Markdown 和按钮降级为可读纯文本                                                        |
| `hideUnsupported`           | boolean / number | `false`         | 消息降级时的隐藏级别，见下方说明                                                          |

`hideUnsupported` 支持以下级别，转换后内容为空时跳过发送：

- `false`：不启用隐藏。
- `true` 或 `1`：隐藏图片、音频、附件等不可读占位符，保留可读内容。
- `2`：按钮仅显示指令数据，链接仅显示 URL。
- `3`：进一步隐藏按钮和链接的数据。
- `4`：不转换，直接丢弃降级数据。

## 文档目录

| 文档                                          | 内容                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| [安装与快速开始](./GETTING_STARTED.md)        | 安装、路由注册和第一个消息回复                               |
| [框架开发指南](./FRAMEWORK.md)                | 群聊、单聊、菜单、面板、管理能力及标准事件，业务开发优先阅读 |
| [扫码登录](./QR_LOGIN.md)                     | 授权流程、密钥重置和失败处理                                 |
| [调用方式与 API 参考](./API.md)               | 调用示例、API 索引、参数与 SDK 方法速查                      |
| [消息类型与格式](./MESSAGES.md)               | Format 映射、Markdown、按钮、Ark 和富媒体                    |
| [事件参考](./EVENTS.md)                       | 事件映射、数据结构与读取示例                                 |
| [常见问题与验证范围](./FAQ.md)                | 排障、能力覆盖和验证命令                                     |
| [QQ 官方开发文档](https://bot.q.qq.com/wiki/) | 平台接口与权限说明                                           |
