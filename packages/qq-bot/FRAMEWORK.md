# 使用 AlemonJS 开发 QQ 机器人

群聊、单聊、频道及机器人公共能力已接入框架 Hook。业务代码只需要从 `alemonjs` 导入；适配器负责将标准参数、结果和事件转换成 QQ 协议，不需要直接使用 `useClient`。

## 功能入口

| 能力                                           | 框架入口                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| 群信息、机器人群内状态、禁言状态               | `useGuild().info / botInfo / muteState`                                               |
| 成员详情、分页列表、移除、封禁、解封、禁言     | `useMember().info / list / kick / ban / unban / mute`                                 |
| 批量移除、黑名单、批量禁言                     | `useMember().kickMany / blacklist / updateBlacklist / muteMany`                       |
| 入群申请列表与审批                             | `useRequest().list / decide`                                                          |
| 自动审批策略及白名单                           | `useRequest().policies.list / create / update / delete / execute / updateWhitelist`   |
| 会话菜单                                       | `useMenu().get / set`                                                                 |
| 指令面板及关联对象                             | `usePanel().list / create / get / update / delete / updateTargets`                    |
| 机器人资料、分享链接                           | `useMe().info / share`                                                                |
| 普通消息、Markdown、按钮、卡片、媒体消息、撤回 | `useMessage().send / delete`                                                          |
| 输入状态、流式消息                             | `useMessage().typing / stream`                                                        |
| 媒体上传、发送、分片准备/完成/合并             | `useMedia().upload / send / sendUser / sendChannel / prepare / finishPart / complete` |
| 互动确认                                       | `useInteraction().ack`                                                                |
| 连接状态、网关信息                             | `useConnection().getStatus / gateway`                                                 |
| 频道日程                                       | `useSchedule().list / get / create / update / remove`                                 |
| 论坛帖子                                       | `useForum().list / get / create / remove`                                             |
| 音频频道                                       | `useAudio().control / join / leave / online`                                          |
| 频道消息频率、接口权限、私信会话、旧公告       | `useChannelSettings()`                                                                |

调用均经过语义化 Action，例如 `menu.set`、`member.blacklist.update`、`request.policy.create`；没有平台 SDK 方法名透传入口。鉴权与连接维护由适配器内部完成。

框架会在请求离开应用前执行官方限制：菜单最多 10 项、子菜单 1–5 项且只支持一层；菜单和面板链接必须是 `https`。面板最多 20 项，`specific` 受众必须与 `group` 或 `c2c` scope 匹配，每次修改受众最多 20 个 ID。频道 scope 不属于本文范围，类型和运行时都会拒绝。

## 上下文与多机器人

在事件处理函数内直接 `useMember(event)`，或者省略参数使用当前事件上下文。定时任务可显式提供标准目标；`BotId` 在整个 Action 链中保持传递。

```ts
import { useGuild, useMember, useMenu, usePanel, ResultCode } from 'alemonjs';

const context = {
  Platform: 'qq-bot',
  BotId: '你的 AppID',
  GuildId: '群 OpenID',
  Target: { scope: 'group' as const, targetId: '群 OpenID' }
};
const [guild] = useGuild(context);
const info = await guild.info();
const [member] = useMember(context);
const page = await member.list({ pagination: { Limit: 30, Cursor: '' } });
if (page.code === ResultCode.Ok) {
  console.log(page.data.Items, page.data.NextCursor);
}
await member.muteMany({ members: [{ userId: '成员 OpenID', operation: 'remove' }] });

const [menu] = useMenu(context);
await menu.set({ items: [{ type: 'message', name: '帮助', text: '/help' }] });
const [panel] = usePanel(context);
await panel.create({
  scope: 'group',
  audience: 'specific',
  guildIds: [context.GuildId],
  panel: { items: [{ type: 'command', name: '签到', description: '每日签到' }] }
});
```

`Target.scope` 区分群聊、单聊、频道及频道私信，避免相同字符串 ID 被路由到错误接口。群聊消息事件已自动携带正确 Target。

主动调用也可以只提供 `Target: { scope: 'group', targetId: '群 OpenID', BotId: 'AppID' }`，无需重复填写 GuildId。仅提供裸 GuildId 无法区分群和频道，相关操作会明确失败。群聊不支持的 `guild.list`、消息查询/编辑/置顶等操作不会回退到频道接口。

## 消息表达

原有 `Text`、`Markdown`、`Button` 等消息构造器继续可用。需要指定消息引用、回复、唤醒或完整键盘布局时，使用框架结构化消息：

```ts
import { useMessage } from 'alemonjs';

const [message] = useMessage(event);
await message.send({
  content: {
    markdown: { content: '# 今日任务', verifyImages: true },
    keyboard: {
      rows: [
        [
          {
            id: 'done',
            label: '完成',
            action: { type: 'callback', data: 'task:done', permission: { type: 'everyone' } }
          }
        ]
      ]
    }
  },
  referenceId: event.MessageContent?.referenceId,
  sequence: 1
});
// 自行指定被动回复目标；与 eventId、wakeup 互斥。
await message.send({ format: [{ type: 'Text', value: '回复' }], replyId: '消息 ID' });
```

`replyId`、`eventId`、`wakeup` 表达消息回复、事件回复、互动召回。未显式提供时，适配器从当前消息/事件选择平台支持的回复方式；普通通知不会把合成 MessageId 当成有效回复 ID。

切换到其他会话发送时，不会自动携带原会话的回复 ID。`wakeup` 仅支持单聊。结构化消息的 markdown、media、card 互斥，键盘模板和自定义 rows 互斥。

单聊流式发送使用标准字段。首段省略 streamId，后续使用返回的 id；同一条流保持 sequence，index 递增。

```ts
await message.typing({ duration: 30 });
const first = await message.stream({ text: '正在生成', mode: 'replace', state: 'generating', index: 0, sequence: 1 });
if (first.code === 2000) {
  await message.stream({ text: '完整结果', mode: 'replace', state: 'complete', streamId: first.data.id, index: 1, sequence: 1 });
}
```

`useMedia().upload({ type, filePath })` 自动处理上传；也可以用 url、base64 data 或已有 fileId。`prepare / finishPart / complete` 提供分片上传会话及合并控制，返回字段不依赖 QQ 的命名。

## 完整事件数据

保持既有事件名，增加标准字段。原始 `event.value` 仍保留以兼容老应用，但以下业务不需要读取它：

| 事件                                               | 标准内容                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `message.create / private.message.create`          | `MessageContent`：消息类型、引用索引、上下文、卡片、递归消息元素；`MessageMedia`：尺寸、语音转换地址与 Transcript |
| `notice.create` 中入群申请                         | `Notice.type === 'join-request'`，`Notice.request` 提供申请 ID、用户、验证问答、来源及自动审批策略                |
| `notice.create / private.notice.create` 中订阅变更 | `Notice.type === 'subscription'`，每个订阅的授权状态、模板、subscriptionId、时间                                  |
| 主动消息开关变更                                   | `Notice.type === 'message-permission'`，`Notice.enabled`                                                          |
| 互动事件                                           | `Interaction.type` 区分按钮、菜单、反馈、清空会话、故事、模型、授权；按钮数据、反馈选项、授权范围等均为标准字段   |
| 好友添加/删除                                      | `FriendSource`：来源场景、分享回传数据、短链码和统一用户标识                                                      |
| 其他事件                                           | 原有标准用户/群/消息字段；`EventId`、`OccurredAt`、`Target` 保留事件标识、来源时间和目标                          |

```ts
import { useRequest, useInteraction } from 'alemonjs';

if (event.Notice?.type === 'join-request') {
  const request = event.Notice.request;
  const [requests] = useRequest(event);
  // 在业务规则决定后提交审核结果。
  await requests.decide({ requestId: request.id, userId: request.userId, approve: false, reason: '暂不接受申请' });
}
if (event.Notice?.type === 'subscription') {
  for (const item of event.Notice.subscriptions) {
    console.log(item.subscriptionId, item.allowed);
  }
}
if (event.Interaction?.requiresAck && !event.Interaction.acknowledged) {
  await useInteraction(event)[0].ack({ code: 0 });
}
```

默认自动确认按钮/菜单事件；需要应用决定确认结果时配置 `autoInteractionAck: false`。其他互动类型不自动 ACK。发送事件回复的 EventId 与互动确认的 InteractionId 分别保留。

## 验证范围

依据 2026-09-20 下载的官方文档，40 个非频道 HTTP 端点均有框架 Hook 的端到端测试；频道基础、内容与设置的 48 个 Action、全部 34 种频道网关事件另有合同测试；16 种非频道事件的 27 个官方示例验证接收及标准化。独立夹具保存在 `tests/fixtures/non-channel.json`，测试不依赖本机被忽略的文档目录。更新文档可运行 `yarn workspace @alemonjs/qq-bot docs:snapshot`。

先构建核心，再执行适配器专项测试：

```sh
yarn workspace alemonjs build
yarn workspace @alemonjs/qq-bot test:non-channel
yarn workspace @alemonjs/qq-bot test:channel
```

这是本地协议与框架合同验证，没有使用真实 QQ 账号在线验收。群管理等受官方权限、频控与内邀资格约束；群 API 没有的全员禁言设置、群流式消息会明确失败，不会误调频道接口。`member.ban` 对群成员执行移除并拉黑，单独黑名单管理用 `updateBlacklist`。调用方应检查 ResultCode，平台错误内容会保留。

## 完整性检查与部分失败

快照脚本枚举 sitemap 的全部自动生成 API/事件引用，仅排除明确的频道路径；当前共有 69 项，其中 40 个 API、16 种事件纳入合同测试，13 项频道引用列为排除。新增非频道引用会进入测试清单，缺失框架实现时覆盖断言失败。这仍不等于官方 sitemap 之外不存在其他能力。

批量移除或黑名单接口即使 HTTP 成功，也可能返回部分失败。此时框架返回 `ResultCode.Warn`，数据保留 `failedBlacklistIds` 或 `failedUserIds`；单成员 ban/unban 同样遵循该规则。移除及黑名单操作校验每次 1–20 个成员。互动确认仅消费一次结果，并保留平台失败结果及 BotId 路由。

批量禁言同样限制 1–20 个成员。策略创建与策略群变更分别校验群 OpenID/群号二选一及 100 个上限；白名单单次为 1–10000 个 QQ 号码。单聊输入状态持续时间为 1–60 秒，流式发送要求非空文本和从 0 开始的整数 index。

源代码类型检查：

```sh
yarn tsc --noEmit -p packages/alemonjs/tsconfig.json
yarn tsc --noEmit -p packages/qq-bot/tsconfig.json
```

## 用户身份与延迟互动

标准事件保留 `SourceUserId`（原始 id）、`DirectUserId`（user_openid）、`MemberId`（member_openid），`UserId` 仍按当前会话选择。成员进退群事件也保留两种身份。不要假设不同身份 ID 可以互换调用平台接口。

`MessageMentions` 和嵌套的 `MessageContent.elements[].author` 使用标准 User 类型，保留统一标识、账号、角色与机器人标记。`useMention(event)` 优先读取标准提及列表，不需要 SDK 或额外平台请求。

延迟任务可以仅传机器人上下文与保存的互动 ID；仍须遵守平台互动时效及只能确认一次的限制：

```ts
import { useInteraction } from 'alemonjs';
await useInteraction({ BotId: 'AppID' })[0].ack({
  InteractionId: '保存的互动 ID',
  target: { scope: 'c2c', targetId: '用户 OpenID' },
  code: 0
});
```

`useRequest().policies.update()` 返回标准 `enabled / expiresAt`；`updateWhitelist()` 返回 `id / whitelistCount / updatedAt`。创建策略的 `guildIds` 与 `guildNumbers` 二选一，类型和运行时均校验，不能同时提供。

## 媒体上传与发送

`useMedia(event)[0].send({ type, fileId })` 可以沿用事件 Target；显式 target 可覆盖接收方。`sendUser` / `sendChannel` 会校验接收方与 target 是否一致，并将所选 BotId 同时用于上传和发送，避免上传到一个会话却发送到另一个会话。

`upload({ ..., send: true })` 表示平台主动发送。需要回复 ID、事件回复、正文、引用或唤醒参数时请使用 `send`；upload 会拒绝这些消息参数，避免静默丢弃。

大文件实际上传使用从 0 开始的分片索引；字节大小以字符串传递，成功上报各分片后调用 `/files` 合并。文件路径按片读取，重试时重新读取对应片段。服务端分片列表若缺片、重复或长度错误，会在上传前失败。SDK 与框架自动上传共用这条实现。

上传缓存按机器人、会话、类型、内容及文件名区分，缓存命中保留资源元数据；未返回有效 TTL 的资源不作永久缓存。新增本地 HTTP 测试校验实际上传字节、尾片、重试和合并请求，不依赖真实 QQ 账号。

## 多机器人回复隔离与机器人资料

显式 `params.target.BotId` 优先于外层目标和事件 BotId，注册表与适配器使用同一规则。跨机器人发送时，即使群 ID 相同，也不会自动沿用原机器人的消息/事件回复 ID；需要显式提供属于目标机器人的 replyId 或 eventId。

`useMe().info()` 返回 BotInfo，包含官方 `UserAvatar`、`UnionId`、`AccountId`，以及平台提供时的 `ShareUrl`、`WelcomeMessage`。`useMe(groupEvent).guilds()` 明确失败，避免把群聊查询误路由成频道列表。资料查询和互动确认保留平台错误码与详情。

业务继续使用 `useMessage().typing / stream`。旧 SDK 辅助方法已同步官方协议：输入状态通过 `/messages` 的 `msg_type=6` 发送；流式辅助方法的 msgId 与 eventId 二选一，事件回复也可单独创建流。

## 流式与互动生命周期

SDK 流式辅助方法会合并并发的结束请求，结束期间拒绝继续更新。更新和结束请求失败后不提前消耗分片序号，结束失败时保留会话供调用方重试；取消或超时后的完成请求不会再发送尾包。框架 `useMessage().stream()` 仍是显式分片接口，由应用管理 index 和 streamId。

自动确认与 `useInteraction().ack()` 共用 SDK 的确认记录。同一互动 ID、同一 code 的并发请求共享结果，已成功确认的重复调用不再发请求；不同 code 会明确失败。平台请求失败会移除记录，允许重试。

确认去重仅在当前客户端进程内生效：成功记录保留 5 分钟，最多保存 1024 条历史记录，不保证跨进程或重启后的去重，也不会延长平台的互动有效期。平台对同一互动只能确认一次的规则仍然适用。
