# @alemonjs/messenger

Facebook Messenger 平台适配器。运行环境 Node.js 22.22+。

## 接入

使用 Facebook Page 和 Page Access Token，申请所需权限并订阅消息；发送遵循 Messenger 消息窗口。

```yaml
messenger:
  account_id: replace-with-page-id
  access_token: replace-with-page-access-token
  app_secret: replace-with-app-secret
  verify_token: replace-with-verify-token
  api_version: v25.0
  callback:
    host: 127.0.0.1
    port: 18116
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/messenger';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

私聊消息、postback。

文本、HTTPS/本地媒体和 quick reply 按钮，验证 HMAC 和 Page ID，忽略 echo 消息。其他模板、会话查询和 Graph API 通过原生 request。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

客户端公开 `request(path, method, body)`；路径相对于固定的平台 API 基址，不接受外部域名或跳转。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://www.postman.com/meta/messenger-platform-api/documentation/iyp204x/messenger-platform-api)
