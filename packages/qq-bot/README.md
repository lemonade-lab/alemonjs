# [https://alemonjs.com/](https://alemonjs.com/)

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
  # 模式(可选，置空将启用webhook模式)
  mode: 'group'
```

> 默认使用 webhook 模式，配置 mode 可选择 websocket 模式

> 配置 webhook 需 ip/域名，一旦生效官方将永久禁用 websocket 模式

```sh
qq-bot:
  master_key:
    - ''
  # 频道沙盒，默认false
  sandbox: false
  # 1）webhook 模式
  # 推荐nginx进行代理 http://localhost:17157/webhook
  port: 17157
  route: '/webhook'
  # 当配置ws的时候，会连接另一台webhook机器人的消息。不会再启动本地端口。
  # 假设代理后的地址为 https://qqbotjs.com
  # ws: 'wss://qqbotjs.com/websocket'
  # 2）websocket 模式
  # 选择模式，即不采用 webhook
  # mode: 'guild'
  # mode: 'group'
  # mode: 'all' # 暂未支持
```

```conf
 server {
        listen       443 ssl http2;
        server_name  bundle.com;
        ssl_certificate /usr/local/nginx/bundle.crt;
        ssl_certificate_key /usr/local/nginx/bundle.key;

        location /webhook {
          # 指向 webhook 服务的端口
          proxy_pass http://localhost:17157;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /websocket {
           # 指向 WebSocket 服务的端口
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
