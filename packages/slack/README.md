# @alemonjs/slack

Slack 平台适配器。运行环境 Node.js 22.22+。

## 接入

Socket Mode；开通消息和交互订阅。App Token 需要 connections:write，Bot Token 按启用动作申请 chat:write、users:read、channels:history 等权限。

```yaml
slack:
  bot_token: replace-with-bot-token
  app_token: replace-with-app-token
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/slack';
start({ platform: [platform] });
```

## 已实现范围

频道/私聊消息、成员进出、消息编辑/删除、表情回应、按钮交互。

支持文本、公开/本地媒体上传、Block Kit 按钮。文件上传完成不等于收到投递回执。私聊 UserId 会先转换为 DM 频道 ID。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`@slack/bolt`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/slackapi/bolt-js)
