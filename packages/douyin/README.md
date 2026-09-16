# @alemonjs/douyin

抖音桌面端 IM 适配器与独立 SDK。SDK 参考 [karin-plugin-adapter-douyin](https://github.com/dmmdekkd/karin-plugin-adapter-douyin/tree/6bdff315ad9b8b5484d80b12f3349e755b0942ab) 的核心实现，可直接连接抖音桌面 IM，无需另行部署网关。来源、版本与 MIT 许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## SDK

从 `@alemonjs/douyin/sdk` 导入。此入口不启动 AlemonJS、CBP、网络连接或账号恢复；应用显式调用后才执行对应操作。运行环境为 Node.js 20.19+，构建产物包含 TypeScript 声明。

```ts
import { DouyinHttp, ImClient, contact, message } from '@alemonjs/douyin/sdk';

const http = new DouyinHttp({ initialCookies: process.env.DOUYIN_COOKIE });
const client = new ImClient({
  http,
  userId: process.env.DOUYIN_UID!, // 数字 UID，始终保留为字符串
  cookies: http.getCookies(),
  deviceId: process.env.DOUYIN_DEVICE_ID
});

client.on('message', event => console.log(event.parsed));
client.on('notice', event => console.log(event.type));
client.on('request', event => console.log(event.type));
client.on('error', error => console.error(error.message));
await client.start();

const target = await contact.resolveFriendAddress(client, '对方数字 UID');
if (target) {
  const result = await message.sendText(client, target, '你好');
  if (result.statusCode !== 0) throw new Error(result.statusMsg);
}
// 结束接收：client.stop(); HTTP 接口不要求先 start()。
```

### 与参考仓库的接口对照

| 能力                       | SDK 接口                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 账号恢复、扫码登录、退出   | `createAccountManager` → `restore` / `loginByQr` / `logout`；另提供 `importSession`、`stop`                                                           |
| 二维码与二次验证           | `getQrcode`、`checkQrconnect`、`pollQrConfirm`、`loginByQrcode`、`sendQrMfaCode`、`validateQrMfaCode`、`validateQrPassword`、`runBrowserVerification` |
| 桌面设备与会话初始化       | `setupDesktopDevice`、`registerDesktopDevice`、`activateDesktopDevice`、`desktopTtwidCheck`、`runPassportWarmup`                                      |
| 文本、真实 @、引用回复     | `client.sendText`、`client.reply`；`message.sendText`、`message.reply`                                                                                |
| 图片、视频、文件上传与发送 | `client.uploadImage` / `uploadVideo` / `uploadFile` / `sendMedia`；`message.sendImage` / `sendVideo` / `sendFile`                                     |
| 合并转发                   | `client.sendMergeForward`、`message.sendForwardNodes`、`buildForwardNodes`、`message.getForwardMessage`；入站节点位于 `event.parsed.nodes`            |
| 撤回与表情回应             | `client.recall`、`client.modifyReaction`；`message.recall`                                                                                            |
| 好友、群、成员、陌生人     | `client.getFriendList` / `getGroupList` / `getGroupMembers` / `getStrangerList`；`contact` 同名函数                                                   |
| 会话地址与单项资料         | `contact.resolveFriendAddress` / `resolveGroupAddress` / `getGroupInfo` / `getGroupMemberInfo` / `getStrangerInfo`                                    |
| 群名称                     | `client.setGroupName`、`contact.setGroupName`                                                                                                         |
| 历史与单条消息             | `client.getChatHistory`、`message.getHistory`、`message.getMessage`                                                                                   |
| 好友申请与入群申请         | `client.getFriendRequests` / `getGroupJoinRequests` / `approveFriend` / `rejectFriend` / `approveGroupJoin` / `rejectGroupJoin`；`request` 同名函数   |
| 昵称、头像、secUid         | `fetchDesktopSelfProfile`、`profile.fetchUserProfile` / `fetchUserProfiles` 及资料缓存函数                                                            |
| 推送、通知与连接           | `client.on/off`：`message` / `notice` / `request` / `ready` / `reconnecting` / `close` / `error`；`client.connected`、`start/stop`                    |
| 协议和媒体工具             | `protocol`（Protobuf / wire / Frontier WS）、`parseMessageContent`、`decryptImage`、`decryptCencSample`、`pickImageUrl`                               |

`ImClient` 同时以 `DouyinClient` 名称导出。上述接口有实际 HTTP/Protobuf/WS 实现，未依赖网关动作转发。参考仓库中标为不支持的语音发送、踢人、禁言等功能不在已实现能力内；语音入站可以解析。默认框架入口使用直连 SDK，显式配置 `gateway` 时保留网关模式。

`ConversationAddress` 包含 `conversationId`、`conversationShortId`、`conversationType`（私聊 `1` / 群聊 `2`）及可选的 `inboxType`。ID 使用字符串以保留 int64 精度。发送/审批返回值应检查 `statusCode`，不能仅以 Promise 是否抛错判断成功。

`message.getHistory(client, address, { cursor, count })` 按会话序号分页；`cursor` 可以是十进制字符串。使用 `{ messageId, count }` 时会先从最近 60 条历史查找消息对应的游标，找不到则抛错。`getMessage` 和 `getForwardMessage` 同样只查最近 60 条。媒体发送接受 `Uint8Array` / `Buffer`；视频需要提供封面和宽高，文件最大 10 MiB。

### 扫码登录与会话恢复

```ts
import { createAccountManager } from '@alemonjs/douyin/sdk';

const manager = createAccountManager({ accountsDir: './data/douyin/accounts' });
await manager.restore(); // 加载会话，不启动 WS

const account = await manager.loginByQr({
  onQr: qr => {
    // 将 qr.qrcodeBase64 展示为二维码，或展示 qr.qrcodeIndexUrl。
  },
  onStatus: status => console.log(status),
  onVerifyUrl: url => console.log('请在浏览器完成验证：', url),
  onMfa: async ({ kind, maskedMobile }) => {
    // 使用应用自己的交互界面收集密码/短信验证码，然后返回字符串。
    throw new Error(`需要输入 ${kind ?? 'sms'} (${maskedMobile ?? ''})`);
  }
});

account.client.on('message', event => console.log(event.text));
await account.client.start();
// manager.stop() 只关闭连接；manager.logout(account.platformUid) 另删除会话文件。
```

设备自动采集沿用上游 Windows WMI 实现；其他系统会沿用保存的设备身份或使用 GUID 回退，平台仍可能要求二次验证。官方浏览器验证页仅监听本机回环地址。SDK 默认不输出日志；可通过 `setSdkLogger` 注入日志接收器。

### 验证范围

`yarn --cwd packages/douyin test` 执行构建及离线测试，使用注入的 HTTP/WS 和模拟客户端验证协议、上传流程、账号路由、事件映射、动作结果与生命周期。不包含真实账号登录、真实投递与线上风控验证。离线通过不等于线上可用性已经验证。

## AlemonJS 直连模式（默认）

```yaml
douyin:
  accounts_dir: ./data/douyin/accounts
  login_qrcode: true # 无已保存账号时启动二维码登录；离线环境请设 false
  # bot_id: '默认账号数字 UID' # 多账号主动操作需指定 BotId，或设置此默认值
  # disabled_accounts: ['不恢复的账号 UID']
```

启动先注册 CBP 动作处理，再恢复会话并连接。`login.qrcode` 交给框架展示；会话保存后发出 `login.success`，WS 可用后才发出 `connection.ready`。`connection.status` 返回 `{ Platform, state, bots, login }`，不是单一 connected 布尔值。停止不会删除账号，会关闭连接、移除监听并取消登录；已发出的 HTTP 请求可能完成，但取消后不会保存新登录会话或启动连接。需要滑块、短信、密码等额外验证时，请先通过 SDK 的 `loginByQr` 回调完成登录并保存到相同目录，框架入口不收集这些敏感凭据。

### 框架动作与边界

| 能力           | 动作与语义                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 会话发送       | `message.send` / `.user` / `.channel` / `.target`；支持 `group`、`c2c`，不将 `channel`、`direct` 冒充抖音会话                                                                            |
| 文本和媒体组合 | Text、MarkdownOriginal、Link、用户 Mention、Image/ImageURL/ImageFile、Attachment；结构化 Markdown 的文本、样式、链接和列表降级为纯文本；未支持的节点明确报错                             |
| 引用回复       | `params.replyId` 查当前账号消息缓存或目标会话最近 60 条历史，校验会话后发送；暂不支持引用与媒体/提及组合                                                                                 |
| 上传和发送     | `media.upload` / `media.send` / `.user` / `.channel`、`file.send.user/channel`；图片和文件来源支持 HTTP(S)、file://、base64://；框架加载上限 10 MiB、下载超时 30 秒                      |
| 上传复用       | `media.upload` 返回不透明 `fileId`，仅可在本进程同账号、同媒体类型复用，不暴露上传密钥；文件必须提供 name                                                                                |
| 合并转发       | `message.forward.user/channel`，目前支持文本节点；视频及富媒体节点请使用 SDK                                                                                                             |
| 撤回与回应     | `message.delete`、`reaction.add/remove`，统一解析完整会话地址；EmojiId 使用抖音表情键，如 `[爱心]`                                                                                       |
| 查询           | `me.info/friends/guilds/threads`、`user.info`、`guild.info/list`、`channel.info/list`、`member.info/list/search`、`mention.get`；用户查询限当前可访问会话，群成员分页不支持 After/Before |
| 群名称与审批   | `guild.update` 仅支持 name；`request.friend/guild` 使用申请事件的 `_flag`，approve 必须是 boolean，不支持审核备注或拒绝原因                                                              |
| 消息历史       | `history.list` 仅支持 before，limit 为 1–60；before 消息需位于最近 60 条；`message.get` 仅查询当前账号已接收消息缓存                                                                     |

群会话 ID 对应 GuildId/SpaceId/ChannelId；抖音没有子频道，`channel.list` 返回群会话本身。私聊 OpenId 和主动 UserId 都使用对端 UID，发送前从好友/陌生人会话解析完整地址。多账号不会隐式选择首个账号；显式 BotId 冲突直接报参数错误。会话、消息及上传凭据缓存各有容量上限，重启后重新解析。

群成员变化映射为 `member.add/remove/update`（自身进退群为 `guild.join/exit`），私聊撤回为 `private.message.delete`。好友建立事实不是申请：前者为 `private.notice.create`，申请才是 `private.friend.add`；入群申请补齐审核列表后产生 `private.guild.add`。框架没有私聊 reaction 事件，因此保留为 `private.notice.create`。原始网络包、Cookie 和媒体解密密钥不进入事件；加密媒体仅提供 FileId，不伪装为可直接下载的明文 URL。

发送成功返回 `ResultCode.Ok` 与 `{ id: 服务端消息ID }`。审核中、SDK 拒绝或响应缺少 ID 都不计为发送成功；所有未知动作明确返回失败。组合消息按顺序发送，失败后停止剩余发送，并保留之前已成功项的结果，调用方不要盲目重试整个组合。通用 Video 缺少 SDK 必需的封面与尺寸，仍须使用 SDK 视频接口；语音发送、踢人、禁言等不支持的能力不会假报成功。

## AlemonJS 网关适配器

仅在显式配置 `gateway` 时使用以下兼容模式。此模式不自动恢复 SDK 账号，其能力仍取决于外部网关；直连模式及独立 SDK 不使用这些 JSON 网关帧。

```yaml
douyin:
  gateway: ws://127.0.0.1:17880
  token: replace-with-a-random-shared-secret # 非本地地址必填
  bot_id: '你的抖音用户 ID'
  reconnect_interval: 5000
```

网关协议为 JSON WebSocket：连接建立后适配器发送 `{ "type": "hello", "version": 2, "bot_id": "...", "capabilities": ["message", "notice", "send", "action"] }`。非本地网关必须使用 `wss://` 并配置 `token`，适配器会以 `Authorization: Bearer <token>` 传递它。网关向适配器发送入站事件：

```json
{
  "type": "message",
  "message": {
    "message_id": "...",
    "conversation_id": "...",
    "conversation_short_id": "...",
    "conversation_type": "private",
    "sender": { "id": "...", "nickname": "...", "avatar": "..." },
    "text": "你好",
    "media": [{ "type": "image", "id": "...", "url": "..." }],
    "reply_to": "被引用的消息 ID",
    "mentions": [{ "id": "被提及用户 ID" }],
    "is_at_me": false,
    "raw": {}
  }
}
```

发送时适配器发出 `{ "type": "send", "request_id": "...", "target": { ... }, "message": { "text": "...", "segments": [], "reply_to": "可选引用消息ID" } }`；网关必须回复 `{ "type": "ack", "request_id": "...", "ok": true, "message_id": "服务端消息ID" }`。发送 ACK 缺少有效字符串 ID 不算成功；非发送动作只要求明确的 ok=true。`segments` 支持 `text`、`mention`、`image`、`audio`、`video`、`file`；`mention.user_id` 存在时网关应发送抖音原生 @，否则退化成文本。媒体 `url` 可为 HTTPS、`file://` 或 `base64://` 来源，由网关处理上传。

适配器支持从入站事件回复，也支持 `message.send.channel`（群会话 ID）与 `message.send.user`（抖音用户 ID）。网关应将这些主动目标解析为实际会话。它还会把 `{ "type": "notice", "notice": { ... } }` 映射为撤回、表情回应和群/好友变更事件；`notice.type` 可为 `message.recall`、`message.reaction`、`friend.increase`、`friend.decrease`、`group.member-increase`、`group.member-decrease`、`group.admin` 或 `group.name-change`。对于 `message.delete`、`reaction.add` 和 `reaction.remove`，适配器会向网关发送 `{ "type": "action", "action": "...", "target": { ... }, "message_id": "..." }`，表情回应另有 `emoji_id`。

控制帧限制为 1 MiB；大文件应使用 `file://` 或 HTTPS URL，避免将文件内容直接放入 JSON。网关不得把 Cookie、设备标识、签名或完整会话凭据写入上述事件或确认帧。

`@alemonjs/douyinbot` 是独立的抖音开放平台 Webhook 机器人适配器，适用于公开平台应用。
