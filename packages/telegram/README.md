# [https://alemonjs.com/](https://alemonjs.com/)

[文档 https://core.telegram.org/bots ](https://core.telegram.org/bots)

## 创建机器人

[访问 https://core.telegram.org/bots/tutorial#obtain-your-bot-token](https://core.telegram.org/bots/tutorial#obtain-your-bot-token)

点击添加`@BotFather`并发送`/newbot`,并继续发送 `NameXBot` 得以生产 `token`

```yaml
79179797979:AAAAAAAAAAAAAABBBBBBCCCCCCCCCC
```

- NameXdBot 即自定义的 bot 名

[访问 https://web.telegram.org/k/#@NameXdBot 以添加](https://web.telegram.org/k/#@NameXdBot)

## USE

- telegram

```sh
yarn add @alemonjs/telegram
```

- alemon.config.yaml

```sh
telegram:
  # 令牌 （必填）
  token: ''
  # 代理地址 (推荐填)
  proxy: 'http://127.0.0.1:7890'
  # 主人编号
  master_key: null
  # other
  base_api_url: null
  #
  request_url: null
  # 使用 user_key
  master_key:
     - 'xxx'
  # 使用 user_id
  master_id:
     - 'yyy'
  # 隐藏不支持的消息类型（可选，默认: false）
  # 1：一级隐藏，不可读占位符（[视频]、[音频]、[图片]、[附件]等）被置空，可读内容保留
  # 2：二级隐藏，按钮仅显示指令数据（如 /挑战），链接仅显示 URL
  # 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
  # 4：四级隐藏，不进行任何转换，降级数据直接丢弃
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: 1
```
