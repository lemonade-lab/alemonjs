# @alemonjs/douyin

抖音开放平台 IM 机器人适配器。它会启动独立的 Webhook 服务，必须将该地址经 HTTPS 反向代理后配置到抖音开放平台。

```yaml
douyin:
  client_key: xxx
  client_secret: xxx
  callback:
    host: 127.0.0.1
    port: 18080
    path: /callbacks/douyin
```

首版处理 `verify_webhook`、`im_receive_msg` 和 `im_group_receive_msg`，校验 `X-Douyin-Signature`，按 `Msg-Id` 去重，并支持对当前私信事件的文本回复。使用前请在抖音控制台申请相应 IM 权限和事件订阅。
