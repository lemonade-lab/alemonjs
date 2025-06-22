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
```
