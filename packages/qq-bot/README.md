# [https://alemonjs.com/](https://alemonjs.com/)

跨平台开发的事件驱动机器人

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
  # 令牌
  token: ''
  # 密钥
  secret: ''
```

```sh
qq-group-bot:
  master_key:
    - ''
  # 默认（请使用nginx进行代理）
  port: 17157
  # 如果在服务器也启动了机器人，可以进行互相调用
  ws: 'ws://...'
```

## Community

QQ Group 806943302
