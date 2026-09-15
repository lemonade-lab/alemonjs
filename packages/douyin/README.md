# @alemonjs/douyin

抖音桌面端 IM 适配器。它参考 `karin-plugin-adapter-douyin` 的会话与消息模型，但不实现其逆向登录、设备伪装或二次验证规避代码。

适配器连接到你自己部署的、受信任的 WebSocket 会话网关；网关使用用户已经授权的抖音桌面端会话，并负责与抖音 IM 通信。这样 Cookie、设备标识和签名不会进入 AlemonJS 进程、日志或事件数据。

```yaml
douyin:
  gateway: ws://127.0.0.1:17880
  token: replace-with-a-random-shared-secret # 非本地地址必填
  bot_id: '你的抖音用户 ID'
  reconnect_interval: 5000
```

网关协议为 JSON WebSocket：连接建立后适配器发送 `{ "type": "hello", "bot_id": "..." }`。非本地网关必须使用 `wss://` 并配置 `token`，适配器会以 `Authorization: Bearer <token>` 传递它。网关向适配器发送入站事件：

```json
{
  "type": "message",
  "message": {
    "message_id": "...",
    "conversation_id": "...",
    "conversation_short_id": "...",
    "conversation_type": "private",
    "sender": { "id": "...", "nickname": "...", "avatar": "..." },
    "text": "你好",
    "media": [{ "type": "image", "id": "...", "url": "..." }],
    "is_at_me": false,
    "raw": {}
  }
}
```

发送时适配器发出 `{ "type": "send", "request_id": "...", "target": { ... }, "message": { "text": "...", "segments": [] } }`；网关必须回复 `{ "type": "ack", "request_id": "...", "ok": true }`。`segments` 支持 `image`、`audio`、`video`、`file`，其 `url` 可为 HTTPS、`file://` 或 `base64://` 来源，由网关处理上传。控制帧限制为 1 MiB；大文件应使用 `file://` 或 HTTPS URL，避免将文件内容直接放入 JSON。当前发送必须从已有的入站会话事件发起，以确保会话 ID 由网关负责解析。

`@alemonjs/douyinbot` 是独立的抖音开放平台 Webhook 机器人适配器，适用于公开平台应用。
