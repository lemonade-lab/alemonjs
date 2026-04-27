# [https://alemonjs.com/](https://alemonjs.com/)

[平台 https://q.qq.com/#/](https://q.qq.com/#/)

[文档 https://bot.q.qq.com/wiki/](https://bot.q.qq.com/wiki/)

## USE

- qq-bot

```sh
yarn add @alemonjs/qq-bot
```

- alemon.config.yaml

```sh
qq-bot:
  # 编号
  app_id: ''
  # 密钥
  secret: ''
```

> 1、默认 websocket 模式，配置 route/port 可选择 webhook 模式

> 2、webhook 模式，需 ip/域名，一旦生效官方将禁用 websocket 模式

> 3、gatewayURL 直连模式，

> 4、域名代理模式

```sh
qq-bot:
  # 频道沙盒，默认false
  # sandbox: false
  # 2）填写将启动 webhook模式
  # port: 17157
  # route: '/webhook'
  # 3) 自定义模式 (用于连接类官网连接方式的指定服务端)
  # gatewayURL: 'ws://[your ip]:8080'
  # 4) 域名代理模式
  # base_url_gateway: https://[your addr]
  # base_url_app_access_token: https://[your addr]
  # 启动md强制转换为text，特别是当没有md权限，但使用了md数据格式时
  markdownToText: true
  # 隐藏不支持的消息类型（可选，默认: false）
  # 1：一级隐藏，不可读占位符（[视频]、[音频]、[图片]、[附件]等）被置空，可读内容保留
  # 2：二级隐藏，按钮仅显示指令数据（如 /挑战），链接仅显示 URL
  # 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
  # 4：四级隐藏，不进行任何转换，降级数据直接丢弃
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: 1
```
