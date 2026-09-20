# 调用方式与 API 参考

[返回 README](./README.md) · [框架开发指南](./FRAMEWORK.md)

## 调用方式

在 alemonjs 开发中调用 QQ Bot 能力有四种方式，按推荐程度排列：

### 一、事件内回复（最常用）

收到消息后直接回复，框架自动按当前事件场景（群/单聊/频道）选择发送通道。命令匹配交给 Router DSL，handler 只负责回复：

```ts
// src/index.ts —— 注册路由
appGroup.use('ping', () => import('./response/ping'));

// src/response/ping.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText('pong') });
};
```

结构化消息（文本 + 图片 + 按钮 + Markdown）用 `Format` 链式构建，文本、Markdown、按钮统一挂到同一个 `format`：

```ts
// src/response/card.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 按钮组：一行两个按钮（command 类型，点击自动在输入框插入指令）
  const bt = Format.createButtonGroup().addRow().addButton('确认', '/confirm').addButton('取消', '/cancel');

  await message.send({
    format: Format.create().addText('请确认操作').addButtonGroup(bt)
  });
};
```

> `useMessage` 不传事件时自动读取当前事件上下文。消息统一用 `Format` 构建，可组合 `addText` / `addImage` / `addMention` / `addButtonGroup` / `addMarkdown` / `addMarkdownOriginal` / `addAttachment` / `addAudio` / `addVideo`；QQ-Bot 平台消息类型详见 [QQ-Bot 消息类型](./MESSAGES.md#qq-bot-消息类型)。

### 二、框架能力调用（推荐）

优先使用 alemonjs 的语义化 Hook：`useMessage`、`useChannel`、`useGuild`、`useMember`、`useRole`、`usePermission`、`useSchedule`、`useForum`、`useAudio` 与 `useChannelSettings`。它们不暴露 QQ SDK 的方法名或鉴权细节。

```ts
// src/response/channel-schedule.ts
import { useSchedule } from 'alemonjs';

export default async () => {
  const [schedule] = useSchedule();
  const res = await schedule.list();
  console.info(res.data);
};
```

`useClient` 仅保留为兼容旧项目的低层逃生口，不应作为新功能的文档入口或推荐路径。

频道设置、接口权限、私信会话和旧版频道公告同样通过框架能力调用：

```ts
import { useChannelSettings } from 'alemonjs';

export default async () => {
  const [settings] = useChannelSettings();
  await settings.requestPermission({ path: '/channels/{channel_id}/messages', method: 'POST' });
};
```

### 三、`sendAction` 调用适配器 Action（能力动作）

`@alemonjs/qq-bot` 在 `cbp.onactions` 中注册了全部能力动作（`message.send`、`group.joinRequest.approve` 等）。在应用侧通过 `alemonjs` 的 `sendAction` 调用，返回标准 `Result[]`：

```ts
// src/response/approve.ts
import { useEvent, useMessage, sendAction, ResultCode, Format } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  const results = await sendAction({
    action: 'group.joinRequest.approve',
    payload: {
      // 透传来源事件：群 openid / 成员 openid 由适配器自动推断，无需手动传
      event: event.current,
      params: {
        op: 'approve',
        joinRequestId: 'JOIN_REQUEST_ID'
      }
    }
  });
  const ok = results.some(item => item.code === ResultCode.Ok);

  await message.send({ format: Format.create().addText(ok ? '已通过' : '操作失败') });
};
```

> **事件上下文自动推断**：与 `message.send` 一致，`payload` 中透传 `event`（来源事件对象）后，群 openid（群消息事件位于 `ChannelId`）、成员 openid（位于 `UserId`）、频道 id（`GuildId`）、子频道 id（`ChannelId`）等均可省略，由适配器自动推断；显式传入的 `payload.ChannelId` / `payload.UserId` / `params.groupOpenId` / `params.memberOpenId` 优先级更高。各 Action 的参数与响应见下方 [API 详解](#api-详解)。框架自带的 `useMember`、`useMessage`、`useMedia`、`useGuild`、`useRequest` 等 Hook 内部即通过 `sendAction` 发送动作，优先使用 Hook 而非直接调 Action。

### 四、主动发送消息（无事件上下文）

通过 `MessageDirect` 主动向目标发送消息（基于 `message.send.channel` / `message.send.user`）：

```ts
import { MessageDirect, Format } from 'alemonjs';

// 主动向群发送（SpaceId 传群 openid 或频道子频道 id）
await MessageDirect.create().sendToChannel({
  SpaceId: 'GROUP_OPENID_OR_CHANNEL_ID',
  format: Format.create().addText('群公告：今晚 8 点开黑')
});

// 主动向用户发送（OpenID 传 C2C 用户 openid 或频道私信 guild_id）
await MessageDirect.create().sendToUser({
  OpenID: 'USER_OPENID',
  format: Format.create().addText('晚上好')
});
```

> 也支持底层 `sendAction({ action: 'message.send.channel', payload: { ChannelId, params: { format } } })` 等价调用。

---

<a id="api-overview"></a>

## API 总览（点击跳转）

### 消息

| API                                               | 说明                                        |
| ------------------------------------------------- | ------------------------------------------- |
| [message.send](#api-message-send)                 | 回复 / 发送消息，自动按事件场景选择发送通道 |
| [message.send.channel](#api-message-send-channel) | 主动向频道（子频道/群）发送消息             |
| [message.send.user](#api-message-send-user)       | 主动向用户（C2C/频道私信）发送消息          |
| [message.delete](#api-message-delete)             | 撤回消息（群/频道/单聊/私信按场景分流）     |
| [message.get](#api-message-get)                   | 获取频道指定消息                            |
| [message.pin / message.unpin](#api-message-pin)   | 添加 / 移除频道精华消息                     |
| [mention.get](#api-mention-get)                   | 获取消息中 @ 提及的用户                     |
| [message.input.notify](#api-message-input-notify) | 发送“正在输入”状态通知（仅单聊）            |

### 群管理

| API                                                          | 说明                        |
| ------------------------------------------------------------ | --------------------------- |
| [group.info](#api-group-info)                                | 获取群基本信息              |
| [group.botState](#api-group-bot-state)                       | 获取机器人群内状态          |
| [group.member.info](#api-group-member-info)                  | 获取群成员详情              |
| [group.joinRequest.list](#api-group-join-request-list)       | 拉取入群申请列表            |
| [group.joinRequest.approve](#api-group-join-request-approve) | 审批入群申请（通过 / 拒绝） |
| [group.mute.setting](#api-group-mute-setting)                | 查询群禁言状态              |
| [group.mute.set](#api-group-mute-set)                        | 设置群成员禁言              |
| [group.strategy.list](#api-group-strategy)                   | 入群自动审批策略列表        |
| [group.strategy.create](#api-group-strategy)                 | 创建入群自动审批策略        |
| [group.strategy.update](#api-group-strategy)                 | 修改入群自动审批策略        |
| [group.strategy.delete](#api-group-strategy)                 | 删除入群自动审批策略        |
| [group.strategy.execute](#api-group-strategy)                | 执行策略全量扫描            |
| [group.strategy.whitelist](#api-group-strategy)              | 修改策略白名单              |

### 频道（Guild）

| API                                       | 说明                         |
| ----------------------------------------- | ---------------------------- |
| [channel.info](#api-channel-info)         | 获取子频道详情               |
| [channel.list](#api-channel-list)         | 获取频道（服务器）子频道列表 |
| [channel.create](#api-channel-create)     | 创建子频道                   |
| [channel.update](#api-channel-update)     | 修改子频道                   |
| [channel.delete](#api-channel-delete)     | 删除子频道                   |
| [channel.announce](#api-channel-announce) | 创建 / 删除频道公告          |

### 成员

| API                                          | 说明                                     |
| -------------------------------------------- | ---------------------------------------- |
| [member.info](#api-member-info)              | 获取频道成员详情                         |
| [member.list](#api-member-list)              | 获取频道成员列表                         |
| [member.kick](#api-member-kick)              | 移出频道成员                             |
| [member.ban / member.unban](#api-member-ban) | 禁言 / 解除禁言（QQ 频道以禁言代替封禁） |
| [member.mute](#api-member-mute)              | 频道成员禁言（指定时长）                 |

### 服务器（Guild）

| API                           | 说明                     |
| ----------------------------- | ------------------------ |
| [guild.info](#api-guild-info) | 获取频道（服务器）详情   |
| [guild.list](#api-guild-list) | 获取机器人加入的频道列表 |
| [guild.mute](#api-guild-mute) | 全员禁言                 |

### 角色

| API                                           | 说明                  |
| --------------------------------------------- | --------------------- |
| [role.list](#api-role-list)                   | 获取频道身份组列表    |
| [role.create](#api-role-create)               | 创建身份组            |
| [role.update](#api-role-update)               | 修改身份组            |
| [role.delete](#api-role-delete)               | 删除身份组            |
| [role.assign / role.remove](#api-role-assign) | 分配 / 移除成员身份组 |

### 媒体 / 文件 / 上传

| API                                                       | 说明                                          |
| --------------------------------------------------------- | --------------------------------------------- |
| [media.send.user](#api-media-send-user)                   | 向用户发送富媒体（图片/视频/音频/文件）       |
| [media.upload.prepare](#api-media-upload-prepare)         | 分片上传准备                                  |
| [media.upload.part.finish](#api-media-upload-part-finish) | 分片完成上报                                  |
| [media.upload.chunked](#api-media-upload-chunked)         | 分片上传全流程（prepare→ 直传 →finish→ 合并） |
| [file.send.channel / file.send.user](#api-file-send)      | 向群 / 用户发送文件                           |
| [stream.message.send](#api-stream-message-send)           | 单聊流式消息                                  |

### 表情 / 权限 / 交互 / 其他

| API                                                 | 说明                             |
| --------------------------------------------------- | -------------------------------- |
| [reaction.add / reaction.remove](#api-reaction-add) | 添加 / 删除表情表态              |
| [reaction.list](#api-reaction-list)                 | 表情表态用户列表                 |
| [permission.get / permission.set](#api-permission)  | 子频道用户权限查询 / 设置        |
| [interaction.response](#api-interaction-response)   | 互动事件回应（解除按钮 loading） |
| [me.info](#api-me-info)                             | 获取机器人自身信息               |
| [me.guilds](#api-me-guilds)                         | 获取机器人频道列表               |

---

## API 详解

> 各 API 均对应官方开发文档中的 HTTP 接口。以下示例均为 `sendAction` 调用方式；除特殊说明外，均可使用 `useClient` 的 SDK 方法获得原始返回数据。需要场景上下文的 action 均支持在 `payload` 中透传 `event`（来源事件对象）自动推断群/频道/用户 id，显式传参优先级更高（见 [调用方式](#调用方式)）。

### 消息 API

<a id="api-message-send"></a>

#### message.send — 回复 / 发送消息

自动按事件的 `_tag` 分发到对应发送通道（群 @、群消息、单聊、频道、频道私信），并支持图片 / Markdown / 按钮 / Ark。

**调用方式一：框架 `useMessage`（推荐）**

```ts
// src/response/hello.ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 纯文本
  await message.send({ format: Format.create().addText('你好') });
  // 图片（URL / Buffer）
  await message.send({ format: Format.create().addImage('https://example.com/a.png') });
  // Markdown（需要平台 MD 权限）
  await message.send({
    format: Format.create().addMarkdown(Format.createMarkdown().addTitle('标题').addText('内容'))
  });
  // 文本 + 按钮
  await message.send({
    format: Format.create().addText('请选择').addButtonGroup(Format.createButtonGroup().addRow().addButton('确认', '/confirm'))
  });
};
```

**调用方式二：`sendAction`**

```ts
const results = await sendAction({
  action: 'message.send',
  payload: {
    event, // 事件对象
    params: {
      format: [{ type: 'Text', value: '你好' }],
      // 图片转存校验失败时拒绝发送（可选）
      forceVerifyImageResource: true
    }
  }
});
```

**发送规则**（参考 `sends.ts`）：

- 纯文本 → `msg_type: 0`
- 包含图片 → 富媒体上传后发送 `msg_type: 7`（Markdown/按钮自动降级为文本合入）
- 包含 Markdown/按钮 → `msg_type: 2`（`markdown.content` 前置合并文本）
- 包含 Ark 卡片 → `msg_type: 3`
- `markdownToText: true` 时全部降级为纯文本
- `hideUnsupported` 转换后内容为空时跳过发送

<a id="api-message-send-channel"></a>

#### message.send.channel — 主动发送到频道 / 群

| 参数            | 类型        | 说明                      |
| --------------- | ----------- | ------------------------- |
| `ChannelId`     | string      | 群 openid 或频道子频道 id |
| `params.format` | DataEnums[] | 消息内容                  |

```ts
// 推荐：MessageDirect
await MessageDirect.create().sendToChannel({
  SpaceId: 'GROUP_OPENID',
  format: Format.create().addText('通知')
});

// 或 sendAction
await sendAction({
  action: 'message.send.channel',
  payload: { ChannelId: 'GROUP_OPENID', params: { format: Format.create().addText('通知').value } }
});
```

<a id="api-message-send-user"></a>

#### message.send.user — 主动发送到用户

| 参数            | 类型        | 说明                                |
| --------------- | ----------- | ----------------------------------- |
| `UserId`        | string      | C2C 用户 openid 或频道私信 guild_id |
| `params.format` | DataEnums[] | 消息内容                            |

```ts
// 推荐：MessageDirect
await MessageDirect.create().sendToUser({
  OpenID: 'USER_OPENID',
  format: Format.create().addText('晚上好')
});

// 或 sendAction
await sendAction({
  action: 'message.send.user',
  payload: { UserId: 'USER_OPENID', params: { format: Format.create().addText('晚上好').value } }
});
```

<a id="api-message-delete"></a>

#### message.delete — 撤回消息

按事件上下文（`SpaceId` / `OpenId`）自动分流到 群撤回 / 频道撤回 / 单聊撤回 / 私信撤回。

| 参数        | 类型   | 说明                                                                                                         |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `MessageId` | string | 要撤回的消息 ID                                                                                              |
| `event`     | object | 当前事件对象（`SpaceId`（`GROUP:`/`GUILD:`）、`OpenId`（`C2C:`/`DIRECT:`）、`ChannelId` 从中读取并自动分流） |

```ts
const [e] = useEvent();

await sendAction({
  action: 'message.delete',
  payload: { MessageId: e.current.MessageId, event: e.current }
});
```

> 对应 SDK：`groupMessageDelete`、`channelsMessagesDelete`、`userMessageDelete`、`dmsMessageDelete`。

<a id="api-message-get"></a>

#### message.get — 获取频道消息

| 参数        | 类型   | 说明      |
| ----------- | ------ | --------- |
| `ChannelId` | string | 子频道 id |
| `MessageId` | string | 消息 ID   |

```ts
await sendAction({ action: 'message.get', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
```

<a id="api-message-pin"></a>

#### message.pin / message.unpin — 频道精华消息

```ts
await sendAction({ action: 'message.pin', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
await sendAction({ action: 'message.unpin', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID' } });
```

> 对应 SDK：`channelsPinsPut` / `channelsPinsDelete`。

<a id="api-mention-get"></a>

#### mention.get — 获取 @ 提及用户

```ts
const [e] = useEvent();
const results = await sendAction({ action: 'mention.get', payload: { event: e.current } });
// results[0].data => [{ UserId, UserName, IsMaster, IsBot, UserKey }]
```

<a id="api-message-input-notify"></a>

#### message.input.notify — 输入状态通知（仅单聊）

展示“正在输入”状态，仅单聊支持；与流式消息是不同能力。

| 参数                  | 类型   | 说明                                   |
| --------------------- | ------ | -------------------------------------- |
| `UserId`              | string | 用户 openid                            |
| `params.input_type`   | number | 输入状态类型，当前固定 `1`（正在输入） |
| `params.input_second` | number | 展示时长（秒），如 `60`                |

```ts
await sendAction({
  action: 'message.input.notify',
  payload: { UserId: 'USER_OPENID', params: { input_type: 1, input_second: 60 } }
});
```

> 参考官方文档 `message/send-receive/streaming.md`：输入状态通过普通发消息接口发送 `msg_type=6` + `input_notify`。

---

### 群管理 API

> 群管理接口要求机器人拥有群管理员身份。通过 `sendAction` 调用时**推荐在 `payload` 中透传 `event`（来源事件对象）**，群 openid 与群成员 openid 由适配器自动推断（群消息事件中群 openid 位于 `ChannelId`、成员 openid 位于 `UserId`）；也可用 `payload.ChannelId` / `payload.UserId` 或 `params.groupOpenId` / `params.memberOpenId` 显式覆盖。`useClient` 直接调 SDK 时按方法签名传参。

<a id="api-group-info"></a>

#### group.info — 获取群基本信息

```ts
// 推荐：透传来源事件，群 openid 自动推断
await sendAction({ action: 'group.info', payload: { event: event.current } });
// 或显式指定群
await sendAction({ action: 'group.info', payload: { params: { groupOpenId: 'GROUP_OPENID' } } });
```

> 对应 SDK：`groupsInfo`；官方文档 `server-inter/group/manage/get-group-info.md`。

<a id="api-group-bot-state"></a>

#### group.botState — 机器人群内状态

```ts
// 透传来源事件，群 openid 自动推断
await sendAction({ action: 'group.botState', payload: { event: event.current } });
```

> 对应 SDK：`groupsBotState`；官方文档 `server-inter/group/manage/get-bot-state.md`。

<a id="api-group-member-info"></a>

#### group.member.info — 群成员详情

```ts
// 推荐：透传事件，群 openid 与成员 openid 自动推断
await sendAction({ action: 'group.member.info', payload: { event: event.current } });
// 显式指定
await sendAction({ action: 'group.member.info', payload: { params: { groupOpenId: 'GROUP_OPENID', memberOpenId: 'MEMBER_OPENID' } } });
```

> 对应 SDK：`groupsMembersMessage`；官方文档 `server-inter/group/manage/get-member.md`。

<a id="api-group-join-request-list"></a>

#### group.joinRequest.list — 拉取入群申请列表

| 参数            | 类型   | 说明                        |
| --------------- | ------ | --------------------------- |
| `params.cursor` | string | 分页游标，首次不传或传空    |
| `params.limit`  | number | 单页数量，默认 20，最大 100 |

```ts
const results = await sendAction({
  action: 'group.joinRequest.list',
  payload: { event: event.current, params: { cursor: '', limit: 20 } }
});
// results[0].data => { list: JoinRequest[], next_cursor: string }
```

> 对应 SDK：`groupsJoinRequestList`；官方文档 `server-inter/group/manage/join-request.md`。

<a id="api-group-join-request-approve"></a>

#### group.joinRequest.approve — 审批入群申请

| 参数                          | 类型    | 说明                                                             |
| ----------------------------- | ------- | ---------------------------------------------------------------- |
| `event`                       | object  | 来源事件（推荐）：群 openid / 申请人 openid 自动推断，无需显式传 |
| `ChannelId` / `UserId`        | string  | 可选，显式指定群 openid / 申请人 openid（优先级高于 event 推断） |
| `params.op`                   | string  | `approve` 通过 / `decline` 拒绝                                  |
| `params.joinRequestId`        | string  | 申请 ID（申请事件 `GROUP_JOIN_REQUEST` 中携带）                  |
| `params.rejectReason`         | string  | 拒绝理由（`op=decline` 时）                                      |
| `params.addToMemberBlacklist` | boolean | 同时加入群黑名单（`op=decline` 时）                              |

```ts
// 通过（推荐：透传事件，自动推断群 openid / 申请人 openid）
await sendAction({
  action: 'group.joinRequest.approve',
  payload: {
    event: event.current,
    params: { op: 'approve', joinRequestId: 'JOIN_REQUEST_ID' }
  }
});

// 拒绝并拉黑（显式指定目标）
await sendAction({
  action: 'group.joinRequest.approve',
  payload: {
    ChannelId: 'GROUP_OPENID',
    UserId: 'MEMBER_OPENID',
    params: { op: 'decline', joinRequestId: 'JOIN_REQUEST_ID', rejectReason: '不符合入群要求', addToMemberBlacklist: true }
  }
});
```

> 对应 SDK：`groupsApprovalJoinRequest`；官方文档 `server-inter/group/manage/join-request.md`。机器人收到 `GROUP_JOIN_REQUEST` 事件（`notice.create`）时即可调用审批。

<a id="api-group-mute-setting"></a>

#### group.mute.setting — 查询群禁言状态

```ts
const results = await sendAction({ action: 'group.mute.setting', payload: { event: event.current } });
// results[0].data => { global_rule: GlobalMuteRule, members: MemberMuteState[] }
```

> 对应 SDK：`groupsRestrictChatSetting`；官方文档 `server-inter/group/manage/mute.md`。

<a id="api-group-mute-set"></a>

#### group.mute.set — 设置群成员禁言

| 参数             | 类型                 | 说明                           |
| ---------------- | -------------------- | ------------------------------ |
| `params.members` | SetMemberMuteState[] | 禁言操作列表，单次不超过 10 个 |

`SetMemberMuteState`：`{ op: 'add' | 'update' | 'del', member_openid, mute_expire_at? }`（`mute_expire_at` 为 RFC3339 时间，`op=del` 可传空串立即解除）。

```ts
await sendAction({
  action: 'group.mute.set',
  payload: {
    params: {
      members: [{ op: 'add', member_openid: 'MEMBER_OPENID', mute_expire_at: '2026-08-05T11:23:05+08:00' }]
    }
  }
});
```

> 对应 SDK：`groupsRestrictChatSettingPost`；官方文档 `server-inter/group/manage/mute.md`。注意新增/更新禁言只能操作普通成员，不能操作群主、管理员或机器人。

<a id="api-group-strategy"></a>

#### group.strategy.\* — 入群自动审批策略

一个机器人最多创建 20 个策略，策略仅在机器人拥有对应群管理员身份时生效。

**group.strategy.list — 策略列表**

```ts
await sendAction({ action: 'group.strategy.list', payload: { params: { cursor: '', limit: 20 } } });
```

**group.strategy.create — 创建策略**

| 参数                  | 类型     | 说明                                                                   |
| --------------------- | -------- | ---------------------------------------------------------------------- |
| `params.groupOpenIds` | string[] | 关联群 openid 列表，与 `groupIds` 二选一                               |
| `params.groupIds`     | string[] | 关联 QQ 群号列表（字符串，避免 JS 精度问题），与 `groupOpenIds` 二选一 |
| `params.isEnable`     | string   | `on` 启用 / `off` 关闭，默认 `on`                                      |
| `params.expireAt`     | string   | 过期时间（RFC3339），不传默认一年后                                    |
| `params.remark`       | string   | 备注，最多 255 字                                                      |

```ts
await sendAction({
  action: 'group.strategy.create',
  payload: { params: { groupOpenIds: ['GROUP_OPENID_1'], isEnable: 'on', remark: '白名单自动入群' } }
});
```

**group.strategy.update — 修改策略**

| 参数                                                    | 类型   | 说明                                                        |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| `StrategyId`                                            | string | 策略 ID                                                     |
| `params.isEnable` / `params.expireAt` / `params.remark` | -      | 同创建                                                      |
| `params.groupAction`                                    | object | `{ op: 'add'\|'del', groupOpenIds?, groupIds? }` 关联群增删 |

**group.strategy.delete — 删除策略**

```ts
await sendAction({ action: 'group.strategy.delete', payload: { StrategyId: 'STRATEGY_ID' } });
```

**group.strategy.execute — 执行策略**

对策略关联的全部群发起全量扫描，将命中白名单号码的入群申请自动审批通过。任务异步执行，约 10 分钟完成。

```ts
await sendAction({ action: 'group.strategy.execute', payload: { StrategyId: 'STRATEGY_ID' } });
```

**group.strategy.whitelist — 修改白名单**

| 参数                    | 类型     | 说明                                                   |
| ----------------------- | -------- | ------------------------------------------------------ |
| `StrategyId`            | string   | 策略 ID                                                |
| `params.op`             | string   | `add` 新增 / `del` 删除                                |
| `params.whitelistUsers` | string[] | QQ 号码列表（字符串），单次最多 10000 个，总上限 10 万 |

```ts
await sendAction({
  action: 'group.strategy.whitelist',
  payload: { StrategyId: 'STRATEGY_ID', params: { op: 'add', whitelistUsers: ['1234567'] } }
});
```

> 对应 SDK：`groupsJoinApprovalStrategies` / `groupsJoinApprovalStrategyCreate` / `groupsJoinApprovalStrategyPatch` / `groupsJoinApprovalStrategyDelete` / `groupsJoinApprovalStrategyExecute` / `groupsJoinApprovalStrategyWhitelistUsers`；官方文档 `server-inter/group/manage/join-approval-strategy.md`。

---

### 频道（Guild）API

<a id="api-channel-info"></a>

#### channel.info — 子频道详情

```ts
await sendAction({ action: 'channel.info', payload: { ChannelId: 'CHANNEL_ID' } });
```

> 对应 SDK：`channels`。

<a id="api-channel-list"></a>

#### channel.list — 子频道列表

```ts
await sendAction({ action: 'channel.list', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guildsChannels`。

<a id="api-channel-create"></a>

#### channel.create — 创建子频道

| 参数              | 类型   | 说明             |
| ----------------- | ------ | ---------------- |
| `GuildId`         | string | 频道（服务器）id |
| `params.name`     | string | 子频道名称       |
| `params.type`     | number | 子频道类型       |
| `params.parentId` | string | 父分组 id        |

```ts
await sendAction({ action: 'channel.create', payload: { GuildId: 'GUILD_ID', params: { name: '游戏区', type: 0 } } });
```

<a id="api-channel-update"></a>

#### channel.update — 修改子频道

```ts
await sendAction({ action: 'channel.update', payload: { ChannelId: 'CHANNEL_ID', params: { name: '新名称', position: 0 } } });
```

<a id="api-channel-delete"></a>

#### channel.delete — 删除子频道

```ts
await sendAction({ action: 'channel.delete', payload: { ChannelId: 'CHANNEL_ID' } });
```

<a id="api-channel-announce"></a>

#### channel.announce — 频道公告

| 参数               | 类型    | 说明                                      |
| ------------------ | ------- | ----------------------------------------- |
| `GuildId`          | string  | 频道 id                                   |
| `params.messageId` | string  | 公告消息 id                               |
| `params.channelId` | string  | 子频道 id（消息 id 存在时必传）           |
| `params.remove`    | boolean | `true` 删除公告（`messageId='all'` 清空） |

```ts
// 创建公告
await sendAction({
  action: 'channel.announce',
  payload: { GuildId: 'GUILD_ID', params: { messageId: 'MSG_ID', channelId: 'CHANNEL_ID' } }
});
// 删除公告
await sendAction({ action: 'channel.announce', payload: { GuildId: 'GUILD_ID', params: { remove: true, messageId: 'MSG_ID' } } });
```

> 对应 SDK：`guildsAnnounces` / `guildsAnnouncesDelete`。

---

### 成员 API

> 以下均为**频道（Guild）**成员接口，群成员接口见 [群管理 API](#群管理-api)。

<a id="api-member-info"></a>

#### member.info — 成员详情

```ts
await sendAction({ action: 'member.info', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
// 或使用框架 Hook：const [member] = useMember(); await member.info({ userId: 'USER_ID' });
```

> 对应 SDK：`guildsMembersMessage`。

<a id="api-member-list"></a>

#### member.list — 成员列表

```ts
await sendAction({ action: 'member.list', payload: { GuildId: 'GUILD_ID', params: { After: '0', Limit: 100 } } });
```

> 对应 SDK：`guildsMembers`。

<a id="api-member-kick"></a>

#### member.kick — 移出成员

```ts
await sendAction({ action: 'member.kick', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
```

> 对应 SDK：`guildsMembersDelete`。

<a id="api-member-ban"></a>

#### member.ban / member.unban — 禁言 / 解除禁言

QQ 频道没有真正意义的封禁，适配器以**禁言**实现 ban：不传时长或时长小于等于 0 时默认禁言 7 天（604800 秒）。

```ts
// 禁言（默认 7 天）
await sendAction({ action: 'member.ban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
// 禁言指定时长（秒）
await sendAction({ action: 'member.ban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', params: { duration: 3600 } } });
// 解除
await sendAction({ action: 'member.unban', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID' } });
```

> 对应 SDK：`guildsMemberMute`（`mute_seconds: '0'` 为解除）。

<a id="api-member-mute"></a>

#### member.mute — 成员禁言（指定时长）

```ts
await sendAction({ action: 'member.mute', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', params: { duration: 600 } } });
```

---

### 服务器（Guild）API

<a id="api-guild-info"></a>

#### guild.info — 频道详情

```ts
await sendAction({ action: 'guild.info', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guilds`。

<a id="api-guild-list"></a>

#### guild.list — 机器人频道列表

```ts
const results = await sendAction({ action: 'guild.list' });
```

> 对应 SDK：`usersMeGuilds`。

<a id="api-guild-mute"></a>

#### guild.mute — 全员禁言

```ts
// 全员禁言（秒）
await sendAction({ action: 'guild.mute', payload: { GuildId: 'GUILD_ID', params: { duration: 600 } } });
// duration 为 0 时解除
await sendAction({ action: 'guild.mute', payload: { GuildId: 'GUILD_ID', params: { duration: 0 } } });
```

> 对应 SDK：`guildsMuteAll`。

---

### 角色 API

<a id="api-role-list"></a>

#### role.list — 身份组列表

```ts
await sendAction({ action: 'role.list', payload: { GuildId: 'GUILD_ID' } });
```

> 对应 SDK：`guildsRoles`。

<a id="api-role-create"></a>

#### role.create — 创建身份组

```ts
await sendAction({ action: 'role.create', payload: { GuildId: 'GUILD_ID', params: { name: '管理员', color: 4278190080 } } });
```

> `color` 为 ARGB HEX 转换后的十进制数值。

<a id="api-role-update"></a>

#### role.update — 修改身份组

```ts
await sendAction({ action: 'role.update', payload: { GuildId: 'GUILD_ID', RoleId: 'ROLE_ID', params: { name: '新名称' } } });
```

<a id="api-role-delete"></a>

#### role.delete — 删除身份组

```ts
await sendAction({ action: 'role.delete', payload: { GuildId: 'GUILD_ID', RoleId: 'ROLE_ID' } });
```

<a id="api-role-assign"></a>

#### role.assign / role.remove — 分配 / 移除成员身份组

```ts
await sendAction({ action: 'role.assign', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', RoleId: 'ROLE_ID' } });
await sendAction({ action: 'role.remove', payload: { GuildId: 'GUILD_ID', UserId: 'USER_ID', RoleId: 'ROLE_ID' } });
```

> 对应 SDK：`guildsRolesMembersPut` / `guildsRolesMembersDelete`（QQ Bot 的 channel_id 传空字符串使用默认）。

---

### 媒体 / 文件 / 上传 API

<a id="api-media-send-user"></a>

#### media.send.user — 发送富媒体到用户

| 参数          | 类型   | 说明                                 |
| ------------- | ------ | ------------------------------------ |
| `UserId`      | string | 用户 openid                          |
| `params.type` | string | `image` / `video` / `audio` / `file` |
| `params.url`  | string | 文件 URL                             |
| `params.data` | string | base64 文件数据                      |

```ts
await sendAction({
  action: 'media.send.user',
  payload: { UserId: 'USER_OPENID', params: { type: 'image', url: 'https://example.com/a.png' } }
});
```

> 对应 SDK：`postRichMediaByUser`。`media.send.channel` 当前不支持（QQ 频道无独立媒体发送接口，请改用 `message.send` 携带图片）；`media.upload` 不支持纯上传。

<a id="api-media-upload-prepare"></a>

#### media.upload.prepare — 分片上传准备

| 参数                 | 类型              | 说明                                                      |
| -------------------- | ----------------- | --------------------------------------------------------- |
| `UserId` / `GroupId` | string            | 用户 openid 或群 openid（二选一，优先 UserId）            |
| `params`             | UploadPrepareData | `{ file_type, file_name, file_size, md5, sha1, md5_10m }` |

```ts
await sendAction({
  action: 'media.upload.prepare',
  payload: { UserId: 'USER_OPENID', params: { file_type: 4, file_name: 'a.zip', file_size: '1024', md5: '...', sha1: '...', md5_10m: '...' } }
});
```

> `md5_10m` 为文件前 `10002432` 字节（约 10MB）的 MD5。文件软限制：图片 20MB / 视频 30MB / 语音 20MB / 文件 200MB，超软限制降级为文件类型，超 200MB 报错。

<a id="api-media-upload-part-finish"></a>

#### media.upload.part.finish — 分片完成上报

| 参数                 | 类型                 | 说明                                         |
| -------------------- | -------------------- | -------------------------------------------- |
| `UserId` / `GroupId` | string               | 用户 / 群 openid                             |
| `params`             | UploadPartFinishData | `{ upload_id, part_index, block_size, md5 }` |

<a id="api-media-upload-chunked"></a>

#### media.upload.chunked — 分片上传全流程（推荐）

自动编排完整流程：`upload_prepare` 拿 `upload_id` 与每片 `presigned_url` → 分片字节 PUT 直传 COS → 每片成功上报 `upload_part_finish` → 全部完成后合并得到 `file_info`。

| 参数                                | 类型             | 说明                              |
| ----------------------------------- | ---------------- | --------------------------------- |
| `UserId` / `GroupId`                | string           | 用户 / 群 openid                  |
| `params.file` 或 `params.file_path` | string \| Buffer | 本地文件路径或文件内容            |
| `params.file_type`                  | number           | 1 图片 / 2 视频 / 3 语音 / 4 文件 |
| `params.file_name`                  | string           | 文件名（可选）                    |
| `params.srv_send_msg`               | boolean          | 是否合并后直接发送（可选）        |

```ts
await sendAction({
  action: 'media.upload.chunked',
  payload: { GroupId: 'GROUP_OPENID', params: { file: 'D:/a.zip', file_type: 4, file_name: 'a.zip' } }
});
```

> 发送消息时 `postRichMediaByUser` / `postRichMediaByGroup` 传入的 `file_data` 超过 10MB 也会自动走此流程。官方文档 `message/send-receive/chunked-upload.md`。

<a id="api-file-send"></a>

#### file.send.channel / file.send.user — 发送文件

```ts
// 向群发送
await sendAction({
  action: 'file.send.channel',
  payload: { ChannelId: 'GROUP_OPENID', params: { file_type: 4, url: 'https://example.com/a.zip', srv_send_msg: true } }
});
// 向用户发送
await sendAction({
  action: 'file.send.user',
  payload: { UserId: 'USER_OPENID', params: { file_type: 4, url: 'https://example.com/a.zip' } }
});
```

<a id="api-stream-message-send"></a>

#### stream.message.send — 单聊流式消息

持续更新同一条回复：首次请求创建，后续请求带 `stream_msg_id` 更新，最后一包 `input_state: 10` 结束。

| 参数                                | 类型   | 说明                                                |
| ----------------------------------- | ------ | --------------------------------------------------- |
| `UserId`                            | string | 用户 openid（仅单聊）                               |
| `params.input_mode`                 | string | `append` 追加（默认）/ `replace` 替换（传全量正文） |
| `params.input_state`                | number | `1` 生成中 / `10` 生成结束                          |
| `params.content_type`               | string | `text` / `markdown`                                 |
| `params.content_raw`                | string | 当前展示内容                                        |
| `params.msg_id` / `params.event_id` | string | 被动回复标识，二选一                                |
| `params.msg_seq`                    | number | 去重序号，同一条内保持一致                          |
| `params.index`                      | number | 分片序号，从 0 递增                                 |
| `params.stream_msg_id`              | string | 首次响应返回的 `id`，后续请求携带                   |

```ts
// 首次
await sendAction({
  action: 'stream.message.send',
  payload: { UserId: 'USER_OPENID', params: { input_mode: 'replace', input_state: 1, content_type: 'text', content_raw: '正在分析...', msg_seq: 1, index: 0 } }
});
// 后续
await sendAction({
  action: 'stream.message.send',
  payload: {
    UserId: 'USER_OPENID',
    params: {
      input_mode: 'replace',
      input_state: 1,
      content_type: 'text',
      content_raw: '正在分析，已找到资料...',
      msg_seq: 1,
      index: 1,
      stream_msg_id: 'STREAM_MSG_ID'
    }
  }
});
// 结束
await sendAction({
  action: 'stream.message.send',
  payload: {
    UserId: 'USER_OPENID',
    params: { input_mode: 'replace', input_state: 10, content_type: 'text', content_raw: '结论：...', msg_seq: 1, index: 2, stream_msg_id: 'STREAM_MSG_ID' }
  }
});
```

> 官方文档 `message/send-receive/streaming.md`。`replace` 模式不允许修改已下发内容前缀（错误码 40007）。

---

### 表情 / 权限 / 交互 API

<a id="api-reaction-add"></a>

#### reaction.add / reaction.remove — 表情表态

| 参数        | 类型   | 说明      |
| ----------- | ------ | --------- |
| `ChannelId` | string | 子频道 id |
| `MessageId` | string | 消息 ID   |
| `EmojiId`   | string | 表情 id   |

```ts
await sendAction({ action: 'reaction.add', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106' } });
await sendAction({ action: 'reaction.remove', payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106' } });
```

> 对应 SDK：`channelsMessagesReactionsPut` / `channelsMessagesReactionsDelete`（type 固定 `1` 系统表情）。

<a id="api-reaction-list"></a>

#### reaction.list — 表情表态用户列表

```ts
const results = await sendAction({
  action: 'reaction.list',
  payload: { ChannelId: 'CHANNEL_ID', MessageId: 'MSG_ID', EmojiId: '106', params: { limit: 20 } }
});
```

> 对应 SDK：`channelsMessagesReactionsUsers`。

<a id="api-permission"></a>

#### permission.get / permission.set — 子频道用户权限

```ts
await sendAction({ action: 'permission.get', payload: { ChannelId: 'CHANNEL_ID', UserId: 'USER_ID' } });
// allow / deny 为权限位字符串，同一位同时为 1 时表现为删除权限
await sendAction({ action: 'permission.set', payload: { ChannelId: 'CHANNEL_ID', UserId: 'USER_ID', params: { allow: '1', deny: '0' } } });
```

> 对应 SDK：`channelsPermissions` / `channelsPermissionsPut`。

<a id="api-interaction-response"></a>

#### interaction.response — 互动事件回应

回应互动事件，解除客户端按钮 loading。收到 `INTERACTION_CREATE` 事件时适配器已自动调用（code 0），一般无需手动调用。

```ts
await sendAction({ action: 'interaction.response', payload: { interaction_id: 'INTERACTION_ID', code: 0 } });
```

> 对应 SDK：`interactionResponse`。互动按钮需 3 秒内响应。

<a id="api-me-info"></a>

#### me.info — 机器人自身信息

```ts
const results = await sendAction({ action: 'me.info' });
// results[0].data => { UserId, UserName, UserAvatar, IsBot: true, ... }
```

> 对应 SDK：`usersMe`。

<a id="api-me-guilds"></a>

#### me.guilds — 机器人频道列表

```ts
const results = await sendAction({ action: 'me.guilds' });
```

> 对应 SDK：`usersMeGuilds`。

---

## SDK 内部与兼容速查

本节面向适配器维护和旧项目迁移：`useClient(event)` 可直接调用 `QQBotAPI` 全部方法，跳过框架 Action 层并返回原始接口数据。新功能请优先补充语义化 Hook 与 Action，不以此作为业务开发入口：

```ts
// src/response/info.ts
import { useClient, useEvent, useMessage, Format } from 'alemonjs';
import { API, platform } from '@alemonjs/qq-bot';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  if (event.current.Platform !== platform) return;

  const [client] = useClient(API);
  const res = await client.groupsInfo('GROUP_OPENID'); // 原始返回

  await message.send({ format: Format.create().addText(JSON.stringify(res)) });
};
```

| 分类     | SDK 方法                                                                                                                                                                                                                        | 说明                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 鉴权     | `getAuthentication` / `gateway`                                                                                                                                                                                                 | 获取 access_token / 网关地址       |
| 单聊     | `usersOpenMessages`                                                                                                                                                                                                             | 发送单聊消息（msg_type 0/2/3/6/7） |
| 单聊     | `userMessageDelete`                                                                                                                                                                                                             | 撤回单聊消息                       |
| 单聊     | `postRichMediaByUser`                                                                                                                                                                                                           | 发送单聊富媒体（超 10MB 自动分片） |
| 单聊     | `streamMessages`                                                                                                                                                                                                                | 流式消息                           |
| 群聊     | `groupOpenMessages`                                                                                                                                                                                                             | 发送群聊消息                       |
| 群聊     | `groupMessageDelete`                                                                                                                                                                                                            | 撤回群消息                         |
| 群聊     | `postRichMediaByGroup`                                                                                                                                                                                                          | 发送群聊富媒体                     |
| 群管理   | `groupsInfo` / `groupsBotState` / `groupsMembersMessage`                                                                                                                                                                        | 群信息 / 状态 / 成员               |
| 群管理   | `groupsJoinRequestList` / `groupsApprovalJoinRequest`                                                                                                                                                                           | 入群申请列表 / 审批                |
| 群管理   | `groupsRestrictChatSetting` / `groupsRestrictChatSettingPost`                                                                                                                                                                   | 禁言查询 / 设置                    |
| 群管理   | `groupsJoinApprovalStrategies` / `groupsJoinApprovalStrategyCreate` / `groupsJoinApprovalStrategyPatch` / `groupsJoinApprovalStrategyDelete` / `groupsJoinApprovalStrategyExecute` / `groupsJoinApprovalStrategyWhitelistUsers` | 入群自动审批策略                   |
| 分片上传 | `usersUploadPrepare` / `groupUploadPrepare` / `usersUploadPartFinish` / `groupUploadPartFinish` / `uploadPartDirect`                                                                                                            | 分片上传各环节                     |
| 频道     | `guilds` / `guildsChannels` / `channels` / `guildsChannelsCreate` / `guildsChannelsUpdate` / `guildsChannelsdelete`                                                                                                             | 频道与子频道管理                   |
| 频道消息 | `channelsMessages` / `channelsMessagesById` / `channelsMessagesDelete` / `dmsMessages` / `dmsMessageDelete`                                                                                                                     | 频道消息收发                       |
| 成员     | `guildsMembers` / `guildsMembersMessage` / `guildsMembersDelete` / `guildsRolesMembers`                                                                                                                                         | 成员管理                           |
| 禁言     | `guildsMuteAll` / `guildsMute` / `guildsMemberMute`                                                                                                                                                                             | 全员 / 批量 / 成员禁言             |
| 角色     | `guildsRoles` / `guildsRolesPost` / `guildsRolesPatch` / `guildsRolesDelete` / `guildsRolesMembersPut` / `guildsRolesMembersDelete`                                                                                             | 身份组管理                         |
| 权限     | `channelsPermissions` / `channelsPermissionsPut`                                                                                                                                                                                | 子频道权限                         |
| 表情     | `channelsMessagesReactionsPut` / `channelsMessagesReactionsDelete` / `channelsMessagesReactionsUsers`                                                                                                                           | 表情表态                           |
| 公告     | `guildsAnnounces` / `guildsAnnouncesDelete`                                                                                                                                                                                     | 频道公告                           |
| 精华     | `channelsPinsPut` / `channelsPinsDelete` / `channelsPins`                                                                                                                                                                       | 精华消息                           |
| 日程     | `channelsSchedules` / `channelsSchedulesSchedule` / `channelsSchedulesPost` / `channelsSchedulesSchedulePatch` / `channelsSchedulesScheduleDelete`                                                                              | 频道日程                           |
| 音频     | `channelsAudioPost` / `channelsMicPut` / `channelsMicDelete`                                                                                                                                                                    | 音频控制 / 上下麦                  |
| 帖子     | `channelsThreads` / `channelsThreadsThread` / `channelsThreadsPut` / `channelsThreadsDelete`                                                                                                                                    | 论坛帖子                           |
| 其他     | `usersMe` / `usersMeGuilds` / `usersMeDms` / `interactionResponse`                                                                                                                                                              | 机器人信息 / 私信会话 / 互动回应   |
