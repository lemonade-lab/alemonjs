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
  # 隐藏不支持的消息类型（可选，默认: false）
  # 开启后，转为文本时不可读内容（如 [视频]、[音频]、[图片]、[附件] 等占位符）将被置空
  # 可读内容（如标题、按钮文本、链接等）仍会保留为纯文本
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: true
```
