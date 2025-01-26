# [https://alemonjs.com/](https://alemonjs.com/)

## USE

- qq

```sh
yarn add @alemonjs/qq
```

> vlyjs 环境下登录时请增加参数 --no-watch 以关闭热重启

- alemon.config.yaml

```sh
qq:
  # 账户
  qq: ''
  # 密码
  password: ''
  # 设备 1:安卓手机、 2:aPad 、 3:安卓手表、 4:MacOS 、 5:iPad 、 6:Tim
  device: ''
  # 签名
  sign_api_addr: ''
  # 版本
  ver: ''
  # 主人[platform:qq]哈希
  master_key:
    - ""
  # 日志等级，默认info
  log_level: 'info',
  # 群聊和频道中过滤自己的消息
  ignore_self: true,
  # 被风控时是否尝试用分片发送
  resend: true,
  # 触发`system.offline.network`事件后的重新登录间隔秒数
  reconn_interval: 5,
  # 是否缓存群员列表
  cache_group_member: true,
  # ffmepg路径
  ffmpeg_path: '',
  ffprobe_path: ''
```
