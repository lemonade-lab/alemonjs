# AlemonJS 事件参考

## 事件类型总览

所有事件类型由 `EventKeys` 联合类型定义：

### 消息事件

| EventKey                 | 类型                        | 说明                    |
| ------------------------ | --------------------------- | ----------------------- |
| `message.create`         | `PublicEventMessageCreate`  | 公域消息（群/频道消息） |
| `private.message.create` | `PrivateEventMessageCreate` | 私域消息（私聊）        |
| `message.update`         | `PublicEventMessageUpdate`  | 消息编辑                |
| `message.delete`         | `PublicEventMessageDelete`  | 消息删除                |
| `message.pin`            | `PublicEventMessagePin`     | 消息置顶                |
| `private.message.update` | `PrivateEventMessageUpdate` | 私聊消息编辑            |
| `private.message.delete` | `PrivateEventMessageDelete` | 私聊消息删除            |

### 表情回应事件

| EventKey                  | 说明         |
| ------------------------- | ------------ |
| `message.reaction.add`    | 表情回应添加 |
| `message.reaction.remove` | 表情回应移除 |

### 交互事件

| EventKey                     | 说明                   |
| ---------------------------- | ---------------------- |
| `interaction.create`         | 公域交互（按钮点击等） |
| `private.interaction.create` | 私域交互               |

### 频道/服务器事件

| EventKey         | 说明       |
| ---------------- | ---------- |
| `channel.create` | 频道创建   |
| `channel.delete` | 频道删除   |
| `channel.update` | 频道更新   |
| `guild.join`     | 加入服务器 |
| `guild.exit`     | 退出服务器 |
| `guild.update`   | 服务器更新 |

### 成员事件

| EventKey        | 说明         |
| --------------- | ------------ |
| `member.add`    | 成员加入     |
| `member.remove` | 成员离开     |
| `member.ban`    | 成员封禁     |
| `member.unban`  | 成员解封     |
| `member.update` | 成员信息更新 |

### 通知/请求事件

| EventKey                | 说明         |
| ----------------------- | ------------ |
| `notice.create`         | 公域通知     |
| `private.notice.create` | 私域通知     |
| `private.friend.add`    | 好友添加请求 |
| `private.friend.remove` | 好友删除     |
| `private.guild.add`     | 入群申请     |

## 事件对象通用字段（AutoFields）

框架自动注入到所有事件对象的字段：

```typescript
type AutoFields = {
  CreateAt: number; // 事件创建时间戳
  DeviceId: string; // 设备/实例 ID
  // 其他框架注入字段...
};
```

## 消息事件核心字段

公域消息 `message.create` 包含：

```typescript
{
  // Platform 基础
  Platform: string;          // 平台标识 ('discord', 'qq-bot' 等)

  // 用户信息
  UserId: string;            // 用户 ID
  UserKey: string;           // 用户唯一 Key (Platform:UserId)
  UserName: string;          // 用户名
  UserAvatar?: string;       // 用户头像 URL
  IsMaster: boolean;         // 是否管理员
  IsBot: boolean;            // 是否机器人

  // 消息信息
  MessageId: string;         // 消息 ID
  MessageText: string;       // 消息文本内容
  MessageBody: any[];        // 消息体（富文本结构）

  // 空间信息
  GuildId?: string;          // 服务器 ID
  ChannelId?: string;        // 频道 ID
  SpaceId?: string;          // 空间 ID（框架统一标识）

  // 框架注入
  CreateAt: number;          // 创建时间
  DeviceId: string;          // 设备 ID
  name: EventKeys;           // 事件类型名称
}
```

## 常用事件类型组合

```typescript
// 所有消息类型（公域 + 私域）
selects: ['message.create', 'private.message.create'];

// 仅公域消息
selects: ['message.create'];

// 包含交互（按钮回调）
selects: ['message.create', 'interaction.create'];

// 全部消息相关
selects: ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'];
```

## createEvent 过滤

在 handler 内对事件进行二次过滤：

```typescript
import { createEvent } from 'alemonjs';

export default async (e, next) => {
  const event = createEvent({
    event: e,
    selects: ['message.create'],
    exact: '/hello'
  });

  // event.selects === true  → 事件类型匹配
  // event.exact === true    → 精确匹配成功
  // event.prefix === false  → 未设置前缀匹配
  // event.regular === false → 未设置正则匹配

  if (!event.selects) {
    next();
    return;
  }
  // 处理...
};
```
