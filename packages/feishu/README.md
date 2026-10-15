# @alemonjs/feishu

飞书 / Lark 平台适配器。运行环境 Node.js 22.22+。

## 接入

长连接应用；订阅 im.message.receive_v1 和需要的卡片/成员事件，申请 IM 收发及群管理权限。domain=lark 使用国际版。

```yaml
feishu:
  app_id: replace-with-app-id
  app_secret: replace-with-app-secret
  # domain: lark
  # bot_id: bot-open-id
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/feishu';
start({ platform: [platform] });
```

## 已实现范围

消息、卡片交互、成员进出。

支持文本、图片上传、文件上传、Opus 音频及按钮卡片。视频按文件发送；音频输入必须已是 Opus。使用 OpenID 主动发私聊，chat_id 发群聊。

`media.upload` 返回可复用的 `fileId`（image_key / file_key），可传给 `media.send*` 再发送，避免重复上传。表情移除会查找当前应用自己的 reaction_id。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`@larksuiteoapi/node-sdk`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/larksuite/node-sdk)
