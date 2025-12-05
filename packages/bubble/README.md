# @alemonjs/bubble

Bubble 平台适配器 for AlemonJS

[文档 https://bubble.alemonjs.com/developer/docs](https://bubble.alemonjs.com/developer/docs)

## 安装

```sh
yarn add @alemonjs/bubble
```

## 配置

在 `alemon.config.yaml` 中配置：

```yaml
bubble:
  # Bot Token（必填）
  token: 'YOUR_BOT_TOKEN'

  # WebSocket Gateway URL（可选，默认: wss://bubble.alemonjs.com/api/bot/gateway）
  GATEWAY_URL: 'wss://bubble.alemonjs.com/api/bot/gateway'

  # API Base URL（可选，默认: https://bubble.alemonjs.com/api/bot/v1）
  API_URL: 'https://bubble.alemonjs.com/api/bot/v1'

  # CDN Base URL（可选，默认: https://bubble-oss-files.alemonjs.com）
  CDN_URL: 'https://bubble-oss-files.alemonjs.com'

  # 订阅的事件类型（可选，默认: 所有可用事件）
  intent:
    - MESSAGE_CREATE
    - DM_MESSAGE_CREATE
    - GUILD_MEMBER_ADD

  # 主人配置（可选）
  master_key: []
  master_id: []

  # 代理配置（可选）
  websocket_proxy: ''
  request_proxy: ''

  # 客户端名称（可选，默认: alemonjs-bot）
  clientName: 'alemonjs-bot'
```

## 功能特性

- ✅ WebSocket Gateway 实时事件推送
- ✅ 完整的 HTTP API 接口支持
- ✅ 文件上传功能
- ✅ 类型安全的 TypeScript 支持
- ✅ 自动重连机制
- ✅ 事件订阅管理

## API 文档

详细的 API 文档请参考：[https://bubble.alemonjs.com/developer/docs](https://bubble.alemonjs.com/developer/docs)

## 支持的事件类型

- `MESSAGE_CREATE` - 频道新消息创建
- `MESSAGE_UPDATE` - 频道消息更新
- `MESSAGE_DELETE` - 频道消息删除
- `MESSAGE_UNPIN` - 频道消息取消置顶
- `DM_MESSAGE_CREATE` - 私聊新消息创建
- `DM_MESSAGE_UPDATE` - 私聊消息更新
- `DM_MESSAGE_DELETE` - 私聊消息删除
- `DM_MESSAGE_UNPIN` - 私聊消息取消置顶
- `GUILD_MEMBER_ADD` - 成员加入服务器
- `GUILD_MEMBER_UPDATE` - 成员更新
- `GUILD_MEMBER_REMOVE` - 成员离开服务器
- `BOT_READY` - 机器人就绪
- `EVENTS_SUBSCRIBED` - 事件订阅成功
- `EVENTS_UNSUBSCRIBED` - 事件取消订阅成功
- `SUBSCRIBE_DENIED` - 订阅被拒绝
