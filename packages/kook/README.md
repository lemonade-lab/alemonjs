# [https://alemonjs.com/](https://alemonjs.com/)

[平台 https://developer.kookapp.cn/doc/](https://developer.kookapp.cn/doc/)

[文档 https://core.telegram.org/bots](https://core.telegram.org/bots)

## USE

- kook

```sh
yarn add @alemonjs/kook
```

- alemon.config.yaml

```sh
kook:
  # 令牌
  token: ''
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
