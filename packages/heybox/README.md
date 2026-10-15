# @alemonjs/heybox

黑盒语音平台适配器。运行环境 Node.js 22.22+。

## 接入

配置黑盒机器人 Token，确保已加入目标房间。协议根据 heybox-bot 1.3.49 源码核对，避免使用丢弃发送 Promise 的封装。

```yaml
heybox:
  token: replace-with-bot-token
  bot_id: '123456'
  # room_id: default-room-id
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/heybox';
start({ platform: [platform] });
```

## 已实现范围

消息、命令、成员进出、表情、卡片按钮。

直连 WebSocket，PING/PONG、重连及 HTTP 响应校验。文本、消息编辑/删除、表情、房间/角色查询及角色分配。未验证消息响应中的 msg_id 时返回失败；其他接口通过原生 request。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

客户端公开 `request(path, method, body)`；路径相对于固定的平台 API 基址，不接受外部域名或跳转。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://heybox.dev/)
- [协议参考 SDK](https://www.npmjs.com/package/heybox-bot)（LGPL-3.0-or-later；使用协议和接口信息，未复制实现代码）
