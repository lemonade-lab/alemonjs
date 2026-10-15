# @alemonjs/google-chat

Google Chat 平台适配器。运行环境 Node.js 22.22+。

## 接入

启用 Google Chat API，使用服务账号或 ADC。认证 Audience 选择 HTTP endpoint URL；普通 Chat app 使用 chat@system.gserviceaccount.com，新版 Workspace add-on 使用配置页提供的专用服务账号。暂不接受 Project Number JWT 模式。

```yaml
google-chat:
  audience: https://bot.example.com/events
  service_account_email: chat@system.gserviceaccount.com
  key_file: /absolute/path/to/service-account.json
  callback:
    host: 127.0.0.1
    port: 18110
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/google-chat';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

消息、卡片点击。

支持 spaces/… 会话发送、图片卡片、按钮卡片、查询、编辑/删除、历史。用户发送先查已有 DM，direct/channel target 使用 space ID。卡片验证签名、受众、email_verified 和服务账号身份。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`@googleapis/chat`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://developers.google.com/workspace/chat/verify-requests-from-chat)
