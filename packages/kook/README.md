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
  # 1：一级隐藏，不可读占位符（[视频]、[音频]、[图片]、[附件]等）被置空，可读内容保留
  # 2：二级隐藏，按钮仅显示指令数据（如 /挑战），链接仅显示 URL
  # 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
  # 4：四级隐藏，不进行任何转换，降级数据直接丢弃
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: 1
```
