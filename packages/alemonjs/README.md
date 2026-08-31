# [ALemonJS](https://alemonjs.com)

专用于开发聊天机器人的 Node.js 框架，它提供了完整的事件驱动架构来处理各种聊天平台的消息和交互。

官网文档 https://alemonjs.com

## 可选的 CBP 文件通知

为不使用父子 IPC、也不连接 WebSocket 的本地进程提供登录状态通知。默认关闭；仅在启动 AlemonJS 的环境中显式设置后生效：

```bash
ALEMON_CBP_FILE_TRANSPORT=1
ALEMON_CBP_FILE_DIR=/var/run/alemon/cbp # 可选，默认 .alemon/cbp
```

启用后目录中会有：

- `status.json`：原子更新的当前 CBP、登录和连接快照；晚启动的消费者先读取它。
- `events.jsonl`：只包含 `login.qrcode`、`login.success`、`connection.ready` 的短事件缓冲。
- `qrcode/<LoginId>.png`：当前二维码；二维码刷新或登录完成后自动清理旧文件。

事件文件默认最多保留 200 条且不超过 1 MiB。可用 `ALEMON_CBP_FILE_MAX_EVENTS`（最大 1000）和 `ALEMON_CBP_FILE_MAX_BYTES`（最大 10 MiB）调整上限。二维码 base64 不会写入事件或快照，消费者使用 `QRCode.imagePath` 或 `QRCode.url`。
