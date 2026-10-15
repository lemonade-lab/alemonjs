# @alemonjs/icqq

ICQQ 平台适配器。运行环境 Node.js 22.22+。

## 接入

直接使用 icqq 0.6.10。该 npm 包已停止维护；能否登录取决于设备、协议版本、签名服务和 QQ 服务端。SDK 输出扫码/滑块提示，原生 login/sliderLogin/sendSmsCode/submitSmsCode 可完成额外验证。

```yaml
icqq:
  uin: '123456789'
  # password: replace-with-password
  data_dir: ./data/icqq
  device_platform: 5
  # sdk:
  #   sign_api_addr: https://sign.example.com
```

```ts
import { start } from 'alemonjs';
import platform from '@alemonjs/icqq';
start({ platform: [platform] });
```

## 已实现范围

私聊/群聊消息、成员进出、撤回、好友/群申请。

文本、原生 @、图片、语音、视频、私聊/群文件、群查询与管理、历史和申请处理。QQ 数字 ID 强制安全整数校验；平台可拒绝任意操作。

`connection.status` 返回当前状态和标准动作的 `capabilities`。未注册动作明确失败，不会静默超时。查询结果保留原始 `value` 并按可用字段映射 UserId / ChannelId / GuildId；分页字段接受框架 Limit / Cursor / Before / After。

逐项 API 入口、框架动作和未映射范围见 [API.md](API.md)。

## 原生 API

适配器客户端通过框架 `useClient` 的 `client.api` 通道调用公开方法，支持点分路径，保留方法的 this。原生 API 的参数遵循平台 SDK/文档，响应不等于业务投递回执。

使用的开源 SDK：`icqq`；依赖通过 npm 引用，没有复制 SDK 源码。完整平台接口可以从 `SDK` 导出直接使用；适配器未将全部 SDK API 逐个映射成统一动作。

平台业务限制、原生 SDK 与统一动作之间的差异见上面的边界说明。复杂卡片、媒体参数和权限管理请使用原生 API，不会编造平台不存在的能力。

## 验证

仓库命令 `yarn test:social` 使用注入的 SDK 和本地 HTTP 回调测试，无真实账号凭据。构建、接口签名核对和离线通过不代表真实登录、消息投递、权限审核及线上风控已经通过。

## 来源

- [SDK / 平台文档](https://github.com/icqqjs/icqq)
