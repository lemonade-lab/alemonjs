# @alemonjs/dingtalk

钉钉机器人平台适配器。运行环境 Node.js 22.22+。

## 接入

创建企业内部应用和 Stream 模式机器人。主动单聊/群聊发送需要对应权限和机器人可访问的目标。

```yaml
dingtalk:
  client_id: replace-with-app-key
  client_secret: replace-with-app-secret
  robot_code: replace-with-robot-code
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/dingtalk';
start({ platform: [platform] });
```

## 已实现范围

机器人消息、卡片回调。

标准发送映射为文本；优先使用未过期会话 Webhook，其次使用主动发送 API。会话 Webhook 不返回消息 ID；主动发送返回 processQueryKey，不能当成消息 ID。支持表情添加/移除，入站富文本图片保留 downloadCode。富媒体/互动卡片使用原生接口。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

完整的机器人服务接口清单、参数类型和框架对应见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

`dingtalk-stream` 负责 Stream 连接，通过 `SDK` 导出；机器人 REST 服务的 29 个具名方法位于 `client.robot`，包含参数及响应类型，另保留 `client.request(path, body?, method?)`。这些方法按官方接口契约实现，没有复制 SDK 实现代码。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/open-dingtalk/dingtalk-stream-sdk-nodejs)
