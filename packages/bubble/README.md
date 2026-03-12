# @alemonjs/bubble

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

  # 隐藏不支持的消息类型（可选，默认: false）
  # 开启后，转为文本时不可读内容（如 [视频]、[音频]、[图片]、[附件] 等占位符）将被置空
  # 可读内容（如标题、按钮文本、链接等）仍会保留为纯文本
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: true
```
