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
  # 令牌
  token: ''
  # 密钥
  secret: ''
```

> 默认使用 1）websocket 模式，配置 route 可选择 webhook 模式

> 配置 webhook 需 ip/域名，一旦生效官方将禁用 websocket 模式

```sh
qq-bot:
  # 频道沙盒，默认false
  sandbox: false
  # 1）websocket 模式
  # mode: 'guild'
  # mode: 'group'
  # 2）webhook 模式
  # 推荐nginx进行代理 http://localhost:17157/webhook
  # 填写将启动 webhook模式
  port: 17157
  route: '/webhook'
  # 当配置ws的时候，会连接另一台webhook机器人的消息。不会再启动本地端口。
  # 假设代理后的地址为 https://qqbotjs.com
  # ws: 'wss://qqbotjs.com/websocket'
  # ws: 'ws://[your ip]:17157/websocket'
  # 3) 自定义模式 (用于连接类官网连接方式的指定服务端)
  # gatewayURL: 'ws://[your ip]:8080'
  # 其他
  # 使用 user_key
  master_key:
     - 'xxx'
  # 使用 user_id
  master_id:
     - 'yyy'
```

```conf
 server {
        listen       443 ssl http2;
        server_name  bundle.com;
        ssl_certificate /usr/local/nginx/bundle.crt;
        ssl_certificate_key /usr/local/nginx/bundle.key;
        # 对应 route: ''
        location /webhook {
          # 指向 webhook 服务的端口 17157
          proxy_pass http://localhost:17157;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
        }
        # 对应 ws: ''
        location /websocket {
           # 指向 WebSocket 服务的端口 17157
           proxy_pass http://localhost:17157;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
        }
}
```
