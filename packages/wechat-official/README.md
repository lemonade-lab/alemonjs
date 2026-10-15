# @alemonjs/wechat-official

微信公众号平台适配器。运行环境 Node.js 22.22+。

## 接入

配置公众号服务器 HTTPS 回调、消息 Token、AES Key（安全模式）和接口 IP 白名单。主动发送受账号资质、接口权限和客服消息窗口限制。

```yaml
wechat-official:
  app_id: replace-with-app-id
  app_secret: replace-with-app-secret
  token: replace-with-callback-token
  # encoding_aes_key: replace-with-43-character-aes-key
  callback:
    host: 127.0.0.1
    port: 18111
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/wechat-official';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

私聊消息、公众号事件。

原生 wechat 处理 XML 和验签；wechat-api 全量 API 通过原生入口使用。标准发送支持客服文本、图片和语音，处理媒体上传与临时文件清理。视频需要缩略图 ID，菜单、素材、模板等使用 SDK 原生接口。AES 回调额外校验接收方 AppID；配置 AES Key 时默认要求加密回调，兼容模式需显式 encryption_mode: compatible。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`wechat-api`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/node-webot/wechat-api)
