# 事件参考

[返回 README](./README.md) · [框架开发指南](./FRAMEWORK.md)

## 事件支持

适配器将 QQ 事件转换为 alemonjs 标准事件，开发时通过 `Router` DSL / `useEvent` 订阅。

各事件对应的数据结构与读取方法见 [事件数据结构](#事件数据结构)，快捷跳转：

| 分类                                | 跳转                                      |
| ----------------------------------- | ----------------------------------------- |
| 消息事件（群 / 单聊 / 频道 / 私信） | [原始数据结构](#event-data-message)       |
| 互动按钮                            | [互动按钮事件](#event-data-interaction)   |
| 入群申请 / 成员 / 好友              | [群管理·成员·好友事件](#event-data-group) |
| 频道事件                            | [频道事件](#event-data-guild)             |
| 字段读取 / @ 提及 / 按场景回复      | [数据使用方法](#event-data-usage)         |

| QQ 事件                                                                                  | 标准事件                                               | 场景                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------- |
| `GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE`                                       | `message.create`                                       | 群消息 / 群 @              |
| `AT_MESSAGE_CREATE` / `MESSAGE_CREATE`                                                   | `message.create`                                       | 频道 @ / 私域全量消息      |
| `C2C_MESSAGE_CREATE`                                                                     | `private.message.create`                               | 单聊                       |
| `DIRECT_MESSAGE_CREATE`                                                                  | `private.message.create`                               | 频道私信                   |
| `INTERACTION_CREATE`                                                                     | `interaction.create` / `private.interaction.create`    | 互动按钮（群/单聊/频道）   |
| `MESSAGE_DELETE` / `PUBLIC_MESSAGE_DELETE`                                               | `message.delete`                                       | 频道消息撤回               |
| `DIRECT_MESSAGE_DELETE`                                                                  | `private.message.delete`                               | 私信撤回                   |
| `GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`                                               | `member.add` / `member.remove`                         | 群成员变动                 |
| `GUILD_MEMBER_ADD` / `GUILD_MEMBER_REMOVE` / `GUILD_MEMBER_UPDATE`                       | `member.add` / `member.remove` / `member.update`       | 频道成员变动               |
| `GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT`                                                    | `guild.join` / `guild.exit`                            | 机器人入群 / 退群          |
| `GUILD_CREATE` / `GUILD_DELETE` / `GUILD_UPDATE`                                         | `guild.join` / `guild.exit` / `guild.update`           | 机器人加入/退出/频道更新   |
| `CHANNEL_CREATE` / `CHANNEL_DELETE` / `CHANNEL_UPDATE`                                   | `channel.create` / `channel.delete` / `channel.update` | 子频道变动                 |
| `MESSAGE_REACTION_ADD` / `MESSAGE_REACTION_REMOVE`                                       | `message.reaction.add` / `message.reaction.remove`     | 表情表态                   |
| `FRIEND_ADD` / `FRIEND_DEL`                                                              | `private.friend.add` / `private.friend.remove`         | 好友添加 / 删除            |
| `GROUP_JOIN_REQUEST`                                                                     | `notice.create`                                        | 用户申请加群（需群管理员） |
| `GROUP_MSG_RECEIVE` / `GROUP_MSG_REJECT` / `MESSAGE_AUDIT_PASS` / `MESSAGE_AUDIT_REJECT` | `notice.create`                                        | 群推送开关 / 消息审核      |
| `FORUM_*` / `AUDIO_*` / 频道 `MESSAGE_AUDIT_*`                                           | `notice.create`                                        | 私域论坛 / 音频 / 频道审核 |
| `C2C_MSG_RECEIVE` / `C2C_MSG_REJECT`                                                     | `private.notice.create`                                | 单聊推送开关               |
| `ERROR`                                                                                  | -                                                      | 连接 / 事件处理错误        |

示例：监听入群申请事件

```ts
// src/index.ts —— 注册纯事件订阅（非命令，使用 router.res）
import { Router, defineChildren } from 'alemonjs';

const router = Router.create({ events: ['notice.create'] });

router.res({ events: ['notice.create'] }, () => import('./response/group-join-request'));

export default defineChildren({
  register() {
    return { responseRouter: router.define };
  }
});
```

```ts
// src/response/group-join-request.ts
import { useEvent, sendAction } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  // value 为原始 QQ 事件：携带 group_openid / join_request_id / member_openid / username 等
  const value = event.value;

  // notice.create 下通过 _tag 区分具体事件
  if (event.current._tag === 'GROUP_JOIN_REQUEST') {
    // 结合 group.joinRequest.approve 审批（透传事件，群 openid / 申请人 openid 自动推断）
    await sendAction({
      action: 'group.joinRequest.approve',
      payload: {
        event: event.current,
        params: { op: 'approve', joinRequestId: value.join_request_id }
      }
    });
  }
};
```

---

## 事件数据结构

事件经过适配器转换为 alemonjs 标准事件后，统一包含两层数据：**标准字段**（框架约定，各平台一致）与 **`value` 原始数据**（QQ 平台推送的原样 payload）。以下结构均依据适配器 `src/register.ts` 与 `src/message/*` 类型定义整理。

### 统一标准字段

| 字段                      | 类型    | 说明                                                                                                           |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `name`                    | string  | 标准事件名：`message.create`、`private.message.create`、`interaction.create`、`member.add`、`notice.create` 等 |
| `value`                   | object  | **原始 QQ 事件**（WebSocket 推送的 `d` 数据），各场景结构见下                                                  |
| `_tag`                    | string  | 来源 QQ 事件名，如 `GROUP_AT_MESSAGE_CREATE`、`GROUP_JOIN_REQUEST`（`.add({ tag })` 存储为 `_tag`）            |
| `Platform`                | string  | `'qq-bot'`                                                                                                     |
| `BotId`                   | string  | 机器人 app_id                                                                                                  |
| `GuildId`                 | string  | 群 openid 或频道 id（群场景即群 openid）                                                                       |
| `SpaceId`                 | string  | 空间标识：`GROUP:{group_openid}` / `GUILD:{channel_id}`                                                        |
| `ChannelId`               | string  | 群 openid 或子频道 id                                                                                          |
| `UserId` / `UserKey`      | string  | 发送者 ID 与框架生成的用户 Key                                                                                 |
| `UserName` / `UserAvatar` | string  | 昵称 / 头像 URL                                                                                                |
| `IsMaster` / `IsBot`      | boolean | 是否主人 / 是否机器人                                                                                          |
| `MessageId`               | string  | 消息 ID（入群申请为拼接 ID）                                                                                   |
| `MessageText`             | string  | 消息文本（已去除 @ 占位符）                                                                                    |
| `OpenId`                  | string  | 回复标识：`C2C:{user_openid}` / `DIRECT:{guild_id}`                                                            |
| `IsAtMe` / `IsPrivate`    | boolean | 是否 @ 机器人 / 是否私聊                                                                                       |
| `Timestamp`               | number  | 框架自动注入的事件创建时间                                                                                     |

### 场景标识规则

| 场景           | `SpaceId`              | `OpenId`                    | `_tag` 示例                                        |
| -------------- | ---------------------- | --------------------------- | -------------------------------------------------- |
| 群聊           | `GROUP:{group_openid}` | `C2C:{member_openid}`       | `GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE` |
| 单聊（C2C）    | 无                     | `C2C:{user_openid}`         | `C2C_MESSAGE_CREATE`                               |
| 频道           | `GUILD:{channel_id}`   | `DIRECT:{guild_id}`         | `AT_MESSAGE_CREATE` / `MESSAGE_CREATE`             |
| 频道私信       | 无                     | `DIRECT:{guild_id}`         | `DIRECT_MESSAGE_CREATE`                            |
| 互动按钮（群） | `GROUP:{group_openid}` | `C2C:{group_member_openid}` | `INTERACTION_CREATE_GROUP`                         |

<a id="event-data-message"></a>

### 消息事件原始数据（`value`）

#### 群消息（`GROUP_MESSAGE_CREATE` / `GROUP_AT_MESSAGE_CREATE`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本（含 @ 占位符）",
  "group_openid": "群 OpenID",
  "group_id": "QQ 群号",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "message_scene": { "ext": [], "source": "" },
  "message_type": 0,
  "author": {
    "id": "发送者 ID",
    "member_openid": "群成员 OpenID",
    "union_openid": "统一标识",
    "username": "昵称",
    "bot": false
  },
  "mentions": [{ "id": "@目标 ID", "username": "昵称", "is_you": true, "member_openid": "..." }]
}
```

> 两个事件结构一致，区别仅在 `_tag` 与 `IsAtMe`：`GROUP_AT_MESSAGE_CREATE` 为群内 @ 机器人触发，`IsAtMe: true`；`GROUP_MESSAGE_CREATE` 为群内任意消息（需订阅全量推送）。

#### 单聊消息（`C2C_MESSAGE_CREATE` → `private.message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "发送者 ID", "user_openid": "用户 OpenID", "username": "昵称" }
}
```

#### 频道消息（`AT_MESSAGE_CREATE` 公域 @ / `MESSAGE_CREATE` 私域全量 → `message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本（含 @ 占位符）",
  "guild_id": "频道 ID",
  "channel_id": "子频道 ID",
  "seq": 1,
  "seq_in_channel": "1",
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "用户 ID", "username": "昵称", "avatar": "头像", "bot": false },
  "mentions": [{ "id": "@目标 ID", "username": "昵称", "avatar": "头像", "bot": false }],
  "member": { "joined_at": "", "nick": "", "roles": [] },
  "attachments": [{ "id": "", "url": "", "content_type": "", "filename": "", "size": 0, "width": 0, "height": 0 }]
}
```

#### 频道私信（`DIRECT_MESSAGE_CREATE` → `private.message.create`）

```jsonc
{
  "id": "消息ID",
  "content": "消息文本",
  "guild_id": "私信会话 ID",
  "src_guild_id": "来源频道 ID",
  "channel_id": "子频道 ID",
  "direct_message": true,
  "timestamp": "2026-08-05T14:19:09+08:00",
  "author": { "id": "用户 ID", "username": "昵称", "avatar": "头像", "bot": false },
  "member": { "joined_at": "" },
  "attachments": []
}
```

<a id="event-data-interaction"></a>

### 互动按钮事件（`INTERACTION_CREATE`）

点击按钮触发，`data.resolved.button_data` 即按钮构造时传入的 `data`。分三种场景（`scene` 字段区分）：

| `scene`   | 标准事件                                                       | 关键字段                                                                                                   |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `'group'` | `interaction.create`（`_tag: INTERACTION_CREATE_GROUP`）       | `group_openid`、`group_member_openid`、`data.resolved.button_data`                                         |
| `'c2c'`   | `private.interaction.create`（`_tag: INTERACTION_CREATE_C2C`） | `user_openid`、`data.resolved.button_data`                                                                 |
| `'guild'` | `interaction.create`（`_tag: INTERACTION_CREATE_GUILD`）       | `guild_id`、`channel_id`、`data.resolved.user_id`、`data.resolved.message_id`、`data.resolved.button_data` |

```jsonc
{
  "id": "互动 ID",
  "scene": "group", // group | c2c | guild
  "chat_type": 1, // 1 群 / 2 私聊 / 0 频道
  "type": 11, // 按钮交互
  "version": 1,
  "group_openid": "群 OpenID",
  "group_member_openid": "点击者 OpenID",
  "data": {
    "type": 11,
    "resolved": { "button_data": "按钮 data", "button_id": 1 }
  }
}
```

> 适配器收到互动事件后会自动 `interactionResponse` 回应（解除按钮 loading），无需手动处理。

<a id="event-data-group"></a>

### 群管理 / 成员 / 好友事件

| 事件                                                        | 标准事件                                       | 原始数据关键字段                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GROUP_JOIN_REQUEST`（用户申请加群）                        | `notice.create`                                | `group_openid`、`join_request_id`、`member_openid`、`username`、`apply_at`、`apply_source`、`verify_info`、`auto_approved` |
| `GROUP_MEMBER_ADD` / `GROUP_MEMBER_REMOVE`（成员进/退群）   | `member.add` / `member.remove`                 | `group_openid`、`member_openid`、`op_member_openid`、`username`                                                            |
| `GROUP_ADD_ROBOT` / `GROUP_DEL_ROBOT`（机器人进/退群）      | `guild.join` / `guild.exit`                    | `group_openid`、`op_member_openid`、`timestamp`                                                                            |
| `FRIEND_ADD` / `FRIEND_DEL`（好友添加/删除）                | `private.friend.add` / `private.friend.remove` | `openid`、`timestamp`                                                                                                      |
| `GROUP_MSG_RECEIVE` / `GROUP_MSG_REJECT`（群推送开关）      | `notice.create`                                | `group_openid`、`op_member_openid`、`timestamp`                                                                            |
| `MESSAGE_AUDIT_PASS` / `MESSAGE_AUDIT_REJECT`（群消息审核） | `notice.create`                                | `group_openid`、`message_id`、`audit_time`                                                                                 |

入群申请 `GROUP_JOIN_REQUEST` 完整字段：

```jsonc
{
  "group_openid": "群 OpenID",
  "join_request_id": "申请 ID（审批回传）",
  "member_openid": "申请人 OpenID",
  "username": "申请人昵称",
  "apply_at": "2026-08-05T17:32:52+08:00",
  "apply_source": "self_apply", // self_apply 主动 / invited 被邀请
  "risk_tips": "",
  "union_openid": "",
  "invited_by": "",
  "bot": false,
  "verify_info": { "method": "verify_message", "verify_message": "验证消息", "review_qa_list": [] },
  "auto_approved": { "strategy_id": "st_xxx" } // 仅自动审批通过事件携带
}
```

<a id="event-data-guild"></a>

### 频道事件

| 事件                                                                               | 标准事件                                               | 原始数据关键字段                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| `GUILD_CREATE`（机器人加入频道）                                                   | `guild.join`                                           | `id`、`name`、`op_user_id`、`owner_id`、`member_count`、`max_members`       |
| `GUILD_DELETE`（机器人退出频道）                                                   | `guild.exit`                                           | `id`、`op_user_id`                                                          |
| `GUILD_UPDATE`（频道信息更新）                                                     | `guild.update`                                         | `id`、`name`                                                                |
| `GUILD_MEMBER_ADD` / `GUILD_MEMBER_REMOVE` / `GUILD_MEMBER_UPDATE`                 | `member.add` / `member.remove` / `member.update`       | `guild_id`、`user{id, username, avatar, bot}`、`nick`、`roles`、`joined_at` |
| `CHANNEL_CREATE` / `CHANNEL_DELETE` / `CHANNEL_UPDATE`                             | `channel.create` / `channel.delete` / `channel.update` | `guild_id`、`id`、`name`、`type`、`parent_id`                               |
| `MESSAGE_REACTION_ADD` / `MESSAGE_REACTION_REMOVE`                                 | `message.reaction.add` / `message.reaction.remove`     | `guild_id`、`channel_id`、`target{id}`、`emoji{id, type}`、`user_id`        |
| `MESSAGE_AUDIT_PASS` / `MESSAGE_AUDIT_REJECT`                                      | `notice.create`                                        | `guild_id`、`channel_id`、`audit_id`、`message_id`                          |
| `FORUM_THREAD_*` / `FORUM_POST_*` / `FORUM_REPLY_*` / `FORUM_PUBLISH_AUDIT_RESULT` | `notice.create`                                        | `guild_id`、`channel_id`、`author_id`、对应的 `*_info`                      |
| `AUDIO_*` / `AUDIO_OR_LIVE_CHANNEL_MEMBER_*`                                       | `notice.create`                                        | `channel_id`、`guild_id`、音频状态或 `user_id`                              |

<a id="event-data-usage"></a>

### 数据使用方法

#### 读取标准字段与原始数据

```ts
// src/response/read-data.ts —— 群消息事件处理
import { useEvent, useMessage, Format } from 'alemonjs';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();

  const current = event.current; // 标准字段
  const value = event.value; // 原始 QQ 数据

  const tag = current._tag; // 'GROUP_AT_MESSAGE_CREATE' | 'GROUP_MESSAGE_CREATE' | ...
  const groupId = current.GuildId; // 群 openid
  const userId = current.UserId; // 发送者 id
  const msg = current.MessageText; // 文本（已去 @）
  const isMaster = current.IsMaster; // 是否主人

  // 原始数据补充信息（标准字段未覆盖的）
  const groupNo = value.group_id; // QQ 群号
  const memberOpenId = value.author.member_openid;
  const atMe = value.mentions?.some(m => m.is_you); // 是否 @ 机器人

  if (isMaster) {
    await message.send({ format: Format.create().addText(`主人说：${msg}`) });
  }
};
```

#### 区分子事件类型

`notice.create` / `message.create` 等标准事件可能由多个 QQ 事件转换而来，通过 `_tag` 区分：

频道的事件处理不需要 `useClient`。常规收发、频道/成员/身份组动作可直接使用 alemonjs 的 `useMessage`、`useGuild`、`useMember` 等标准 Hook；对于论坛、音频和审核等没有跨平台语义的事件，用本包的 `useValue` 获取完整且有类型的 QQ 原始 payload。

```ts
import { useEvent } from 'alemonjs';
import { useValue } from '@alemonjs/qq-bot';

export default () => {
  const [event] = useEvent();
  const [value] = useValue(event);

  if (event.current._tag === 'FORUM_THREAD_CREATE' && 'thread_info' in value) {
    // value.thread_info、value.channel_id 等均来自 QQ 原始事件
    console.info(value.thread_info);
  }
};
```

```ts
const tag = event.current._tag;

if (tag === 'GROUP_JOIN_REQUEST') {
  // 入群申请
} else if (tag === 'MESSAGE_AUDIT_PASS') {
  // 群消息审核通过
}
```

#### 读取 @ 提及用户

```ts
import { useMention } from 'alemonjs';

export default async () => {
  const [mention] = useMention();

  const all = await mention.find(); // 全部提及
  const one = await mention.findOne({ IsBot: false }); // 第一个非机器人
  // each => { UserId, UserKey, UserName, IsMaster, IsBot }
};
```

#### 按场景回复

标准字段里的 `SpaceId` / `OpenId` 可直接用于主动发送（`MessageDirect`），无需手动解析：

```ts
// 群消息 → 回同群
await MessageDirect.create().sendToChannel({
  SpaceId: event.current.SpaceId, // 'GROUP:{group_openid}'
  format: Format.create().addText('收到')
});
// 单聊消息 → 回同用户
await MessageDirect.create().sendToUser({
  OpenID: event.current.OpenId, // 'C2C:{user_openid}'
  format: Format.create().addText('收到')
});
```
