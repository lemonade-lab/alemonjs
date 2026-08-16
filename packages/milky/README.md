# @alemonjs/milky

Milky 是新时代 QQ 机器人应用接口标准（HTTP / WebSocket / SSE / WebHook）。

该适配器以官方 Milky IR（`@saltify/milky-protocol`）为准，事件与 API 字段请以 https://milky.ntqqrev.org/ 为准。

## 配置示例

```yaml
milky:
  # 协议端地址，可带 http:// 或 https://
  host: '127.0.0.1'
  # 协议端 HTTP 端口
  port: 8080
  # 路径前缀
  prefix: ''
  # 事件推送方式：ws / sse / webhook
  connection: 'ws'
  # access_token
  access_token: ''
  # HTTP API 超时时间（秒）
  http_timeout: 15
  # WebSocket 心跳间隔（秒）
  heartbeat: 30
  # 断线重连基础间隔（秒）
  reconnect_interval: 10
  # WebHook 接收路径
  webhook_path: '/milky'
  # WebHook 服务监听端口
  webhook_port: 17159
  # 使用 user_key
  master_key:
    - 'xxx'
  # 使用 user_id
  master_id:
    - 'yyy'
```

## 说明

- 事件连接：`ws` 连接 `/event` 的 WebSocket；`sse` 连接 `/event` 的 SSE；`webhook` 在本地监听 `webhook_path`。
- API 调用：统一 `POST /api/<action>`，`Authorization: Bearer <access_token>`。
- 消息段转换以官方 Milky IR 的 `IncomingSegment` / `OutgoingSegment` 为准。
