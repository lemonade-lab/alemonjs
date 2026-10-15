# @alemonjs/wechat-kf

微信客服平台适配器。运行环境 Node.js 22.22+。

## 接入

配置微信客服消息回调及企业可信 IP。使用客服 Secret，不是企业微信智能机器人 Secret。回调必须使用 AES 加密。

```yaml
wechat-kf:
  corp_id: replace-with-corp-id
  secret: replace-with-kf-secret
  token: replace-with-callback-token
  encoding_aes_key: replace-with-43-character-aes-key
  open_kfid: replace-with-open-kfid
  state_path: ./data/wechat-kf/state.json
  callback:
    host: 127.0.0.1
    port: 18112
    path: /events
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/wechat-kf';
start({ platform: [platform] });
```

将 `callback` 监听地址经 HTTPS 反向代理后注册到平台；不同适配器同时运行时必须使用不同端口。

## 已实现范围

回调通知触发 sync_msg 拉取客户消息。

客服文本及图片/语音/视频/文件收发、客服资料和客户查询。通知入库后应答，后台串行拉取，游标和待处理通知原子保存到 state_path；重启恢复。单个 state_path 只允许一个进程使用；跨进程消费和业务去重需部署侧处理。其他接口通过原生 request，发送受客服会话状态限制。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

客户端公开 `request(path, method, body)`；路径相对于固定的平台 API 基址，不接受外部域名或跳转。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://developer.work.weixin.qq.com/document/path/94670)
