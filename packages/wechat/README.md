# @alemonjs/wechat

基于 `@juzi/wechaty` 的微信平台适配器。启动后由 WeChaty 产生登录二维码；无需配置机器人 Token。

```yaml
wechat:
  # 可选：Wechaty 实例名
  name: alemonjs
  # 可选：二维码图片服务前缀
  qrcode_url: https://wechaty.js.org/qrcode/
  master_key: []
```

## 登录生命周期

适配器通过 CBP 向应用子进程和已连接的 full-receive WebSocket 广播：

- `login.qrcode`：展示 `QRCode.url`；同一 `LoginId` 可用于关联登录完成事件。
- `login.success`：扫码已授权。
- `connection.ready`：微信连接已可用；业务应以此事件作为开始条件。

客户端刚连接时先调用 `connection.status`。若 `data.login.state` 为 `awaiting_qrcode`，可用 `data.login.qrcode.url` 恢复二维码；这避免错过即时事件。

二维码属于管理员登录能力，只应提供给受认证的控制端。
