# @alemonjs/wechat-clawbot

微信个人号（iLink ClawBot）适配器，基于 [alemonjs](https://github.com/lemonade-lab/alemonjs) 框架开发。

基于微信 iLink bot API 实现个人号消息收发：二维码扫码登录、凭据与上下文持久化、会话过期自动重登、长轮询接收消息，支持文本 / 图片 / 语音 / 视频 / 文件的收发（媒体经 AES 加密上传 CDN），Markdown 消息自动降级为纯文本。

## 安装

```sh
yarn add @alemonjs/wechat-clawbot
```

## 使用

```ts
import { start } from 'alemonjs';
import wechat from '@alemonjs/wechat-clawbot';

start({
  platform: [wechat]
});
```

首次启动会在终端打印登录二维码，使用微信扫码确认即可；凭据默认保存在 `~/.alemonjs-wechat`，后续启动自动复用，会话过期时自动重新登录。

## 配置

在 `alemon.config.yaml` 中以 `wechat-clawbot` 为键进行配置：

```yaml
wechat-clawbot:
  # iLink API 基础 URL
  base_url: 'https://ilinkai.weixin.qq.com'
  # CDN 基础 URL
  cdn_base_url: 'https://novac2c.cdn.weixin.qq.com/c2c'
  # 存储目录（用于保存凭据和上下文）
  # storage_dir: '~/.alemonjs-wechat'
  # 日志级别: debug, info, warn, error
  log_level: 'info'
  # 二维码轮询间隔（毫秒）
  qr_poll_interval: 2000
  # API 超时时间（毫秒）
  api_timeout: 15000
  # 长轮询超时时间（毫秒）
  long_poll_timeout: 35000
  # 会话过期后自动重新登录
  auto_relogin: true
```

## 支持的事件

| 事件                     | 说明     |
| ------------------------ | -------- |
| `private.message.create` | 私聊消息 |

## 支持的动作

| 动作                | 说明               |
| ------------------- | ------------------ |
| `message.send`      | 回复当前会话       |
| `message.send.user` | 向指定用户发送消息 |
| `me.info`           | 获取机器人信息     |

## API

适配器通过 `client.onAPI` 透传 `WeChatClient` 的全部方法（`getQRCode`、`getUpdates`、`sendMessage`、`getUploadUrl` 等）。

## 相关

- [@alemonjs/wechat](https://github.com/lemonade-lab/alemonjs/tree/main/packages/wechat)：基于 Wechaty 的微信适配器
