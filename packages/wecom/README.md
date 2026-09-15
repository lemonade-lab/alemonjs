# @alemonjs/wecom

企业微信智能机器人（长连接）适配器。创建机器人时选择 API 模式和长连接，填写取得的 Bot ID 与 Secret：

```yaml
wecom:
  bot_id: aibot_xxx
  secret: xxx
```

支持单聊、群聊文本消息、模板卡片点击，以及文本和 Markdown 主动发送。图片和文件的原始加密帧保留在 `event.value`，可通过 SDK 的 `downloadFile(url, aeskey)` 显式下载解密。长连接不需要配置公网回调地址。
