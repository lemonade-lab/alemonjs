# @alemonjs/teams

Microsoft Teams 平台适配器。运行环境 Node.js 22.22+。

## 接入

在 Teams 注册机器人和应用，配置 SDK 的 /api/messages HTTPS 接收地址。身份验证和会话记录由 Teams SDK 管理。

```yaml
teams:
  client_id: replace-with-client-id
  client_secret: replace-with-client-secret
  tenant_id: replace-with-tenant-id
  port: 18082
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/teams';
start({ platform: [platform] });
```

## 已实现范围

消息；消息中的提交载荷保留于 value。

支持已知会话发送、回复、HTTPS 附件、Adaptive Card 按钮、编辑/删除和成员查询。direct scope 指 conversation_id；向 user ID 发送需当前进程已见过该私聊。原生 app.api/app.graph 覆盖其他接口。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`@microsoft/teams.apps`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://microsoft.github.io/teams-sdk/)
