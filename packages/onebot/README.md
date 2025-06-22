# [https://alemonjs.com/](https://alemonjs.com/)

- alemomn.config.yaml

```yaml
onebot:
  url: '' # 正向url
  token: '' # access_token
  reverse_enable: false # 启用后正向连接配置失效，地址：ws://127.0.0.1:17158
  reverse_port: 17158 # 返向连接服务端口，启用反向连接后生效
  master_key: null
  # 使用 user_key
  master_key:
     - 'xxx'
  # 使用 user_id
  master_id:
     - 'yyy'
```
