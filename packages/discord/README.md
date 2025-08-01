# [https://alemonjs.com/](https://alemonjs.com/)

[平台 https://discord.com/developers/applications/](https://discord.com/developers/applications/)

[文档 https://discord.com/developers/docs/intro](https://discord.com/developers/docs/intro)

## USE

- discord

```sh
yarn add @alemonjs/discord
```

- alemon.config.yaml

```sh
discord:
  # 令牌
  token: ''
  # 前缀（非必填）
  intent: null
  # 活动 非必填）
  shard: null
  # 使用 user_key
  master_key:
     - 'xxx'
  # 使用 user_id
  master_id:
     - 'yyy'
  # 请求代理（推荐使用）配置参考 axios
  request_config:
    proxy:
      protocol: 'http'
      host: 'localhost'
      port: 7890
  # ws 代理
  websocket_proxy: 'http://localhost:7890'
  # request_proxy: 'http://localhost:7890'

```

```sh
# 禁用 SSL 证书验证，允许连接使用无效或自签名的证书
env.NODE_TLS_REJECT_UNAUTHORIZED=0
```
