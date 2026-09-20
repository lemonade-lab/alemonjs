# 常见问题与验证范围

[返回 README](./README.md) · [框架开发指南](./FRAMEWORK.md)

## 常见问题

**1. Webhook 模式无法收到事件？**

- 需公网 ip/域名，且官方平台配置的回调地址与 `route`/`port` 一致；
- Webhook 启用后官方会禁用 WebSocket 模式。

**2. 发送 Markdown 报错 / 不渲染？**

- 需要平台开通 Markdown 消息权限；未开通可在配置中开启 `markdownToText: true` 降级为纯文本。

**3. 图片 / 视频 / 语音 / 文件发送失败？**

- 富媒体有软限制（图片 20MB / 视频 30MB / 语音 20MB / 文件 200MB），超软限制自动降级为文件类型，超 200MB 硬限制报错；
- 大于 10MB 的文件自动走分片上传流程（`media.upload.chunked`）；
- 文件格式需符合要求（视频 mp4、语音 silk）；文件发送能力以平台开放为准，失败时会降级为 `[附件]` 文本。

**4. `member.ban` 与 `member.mute` 的区别？**

- QQ 频道无封禁能力，`member.ban` 使用禁言实现（默认 7 天）；`member.mute` 按传入 `duration` 秒数禁言。

**5. 群管理接口报权限错误？**

- 机器人需拥有对应群的**管理员身份**；入群自动审批策略最多创建 20 个。

**6. `group.joinRequest.approve` 需要哪些参数？**

- 推荐在 `payload` 中透传 `event`（来源事件对象），群 openid / 申请人 openid 由适配器自动推断（群消息事件中群 openid 位于 `ChannelId`、成员 openid 位于 `UserId`）；也可用 `payload.ChannelId` / `payload.UserId` 或 `params.groupOpenId` / `params.memberOpenId` 显式指定（优先级更高）；
- `joinRequestId` 从 `GROUP_JOIN_REQUEST` 事件（`notice.create`）携带的 `join_request_id` 获取。

**7. 扫码登录后，原来在别处运行的机器人掉线了？**

- 扫码授权会**重置机器人的 AppSecret，旧密钥失效**，旧实例自然无法继续鉴权；将旧实例的 `secret` 更新为扫码后写入配置的新密钥即可恢复，详见 [扫码登录](./QR_LOGIN.md#扫码登录)。

---

## 群聊、单聊与机器人能力（2026-09-20 核对）

[框架开发指南](./FRAMEWORK.md) 提供消息、群成员、审批策略、菜单、面板、媒体和事件的完整入口。业务代码只从 `alemonjs` 导入：

```ts
import { useMember, useMenu, usePanel, useMessage } from 'alemonjs';

const [members] = useMember(event);
const result = await members.list({ pagination: { Cursor: '' } });
const [menu] = useMenu(event);
await menu.set({ items: [{ type: 'message', name: '帮助', text: '/help' }] });
```

此次覆盖 40 个官方非频道端点、16 种业务事件。事件通过 `Notice`、`Interaction`、`MessageContent` 等标准字段表达，不要求业务解析平台原始数据。验证：先构建 alemonjs，再运行 `yarn workspace @alemonjs/qq-bot test:non-channel`。
