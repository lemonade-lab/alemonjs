# @alemonjs/whatsapp

WhatsApp 平台适配器。运行环境 Node.js 22.22+。

## 接入

使用 WhatsApp Cloud API / Business Platform，订阅对应 WABA 的消息。个人 WhatsApp Web 接入不在本包范围；发送受会话窗口、模板和账号权限约束。

```yaml
whatsapp:
  phone_number_id: replace-with-phone-number-id
  access_token: replace-with-access-token
  app_secret: replace-with-app-secret
  verify_token: replace-with-verify-token
  api_version: v25.0
  callback:
    host: 127.0.0.1
    port: 18115
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/whatsapp';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

客户私聊消息及消息中的按钮/列表载荷。

文本、图片/音频/视频/文件与 reaction；支持 HTTPS 来源或上传本地/base64 媒体后用返回 ID 发送。支持最多 3 个回复按钮。验证 Meta HMAC、校验 phone_number_id。模板及其他复杂消息通过原生 Graph request。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

客户端公开 `request(path, method, body)`；路径相对于固定的平台 API 基址，不接受外部域名或跳转。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api)
