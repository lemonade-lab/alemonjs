# @alemonjs/line

LINE 平台适配器。运行环境 Node.js 22.22+。

## 接入

Messaging API 账号；将 HTTPS 地址配置到 Webhook URL。启用群聊需要平台账号允许机器人入群。

```yaml
line:
  channel_access_token: replace-with-channel-token
  channel_secret: replace-with-channel-secret
  callback:
    host: 127.0.0.1
    port: 18102
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/line';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

单聊/群聊消息、postback、成员加入/离开。

支持文本、HTTPS 图片和 1–4 个按钮的模板。上下文回复使用 replyToken，主动发送使用 pushMessage。音频 duration、视频预览及 Flex Message 等复杂格式通过 SDK 原生消息发送。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`@line/bot-sdk`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/line/line-bot-sdk-nodejs)
