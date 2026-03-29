# AlemonJS Hooks 参考

## useMessage

发送消息的核心 hook。

```typescript
import { useMessage, Format } from 'alemonjs';

const [message] = useMessage(event);

// 发送格式化消息（推荐）
message.send({
  format: Format.create().addText('Hello'),
  replyId: string // 可选，回复指定消息 ID（默认回复触发消息）
});

// 发送 DataEnums 数组（底层 API）
message.send([Text('Hello')]);
```

**返回值**：`Promise<Result[]>`，每个 Result 包含 `{ code, message, data: { id } }`

## useMention

获取消息中 @提及的用户信息。

```typescript
import { useMention } from 'alemonjs';

const [mention] = useMention(event);

// 查找所有符合条件的提及用户
const users = await mention.find({
  UserId: string, // 按用户 ID 过滤
  UserKey: string, // 按用户 Key 过滤
  UserName: string, // 按用户名过滤
  IsMaster: boolean, // 是否管理员
  IsBot: boolean // 是否机器人（默认排除 bot）
});
// 返回: { code, message, data: User[], count: number }

// 查找第一个符合条件的用户
const user = await mention.findOne({ IsMaster: true });
// 返回: { code, message, data: User | null, count: number }
```

**User 类型**：

```typescript
type User = {
  UserId: string;
  UserKey: string;
  UserName: string;
  UserAvatar?: string;
  IsBot?: boolean;
  IsMaster?: boolean;
};
```

## useSubscribe

跨生命周期的事件订阅机制，用于实现"等待用户回复"等交互模式。

```typescript
import { useSubscribe } from 'alemonjs';

const [subscribe] = useSubscribe(event, ['message.create']);

// 在 create 阶段注册订阅
const reg = subscribe.create(
  async (ev, next) => {
    // ev 是新的事件，满足 keys 匹配条件时触发
    // 处理逻辑...
  },
  ['UserId', 'MessageText'] // 监听条件：event 上的哪些 key
);
// 返回: { selects, choose: 'create', id: string }

// 在 mount 阶段注册
subscribe.mount(callback, keys);

// 在 unmount 阶段注册
subscribe.unmount(callback, keys);

// 取消订阅
subscribe.cancel(reg);
```

**订阅匹配机制**：

```
注册时存储 keys 的值（如 UserId='123', MessageText='hello'）
    │
新事件到达 → 对比事件上相同 key 的值
    │
全部匹配 → 触发 callback
```

**生命周期**：

```
create → mount → unmount
  │        │        │
  ▼        ▼        ▼
 订阅1    订阅2    订阅3
```

## useMember（实验性）

获取成员详细信息。

```typescript
import { useMember } from 'alemonjs';

const [member] = useMember(event);

const info = await member.information({ userId: '123' });
// 返回: Result<User | null>
```

## useChannel（预留）

频道操作 hook，尚未实现。

```typescript
import { useChannel } from 'alemonjs';
const [channel] = useChannel(event);
```

## createEvent

在 handler 内部创建事件上下文，进行二次过滤。

```typescript
import { createEvent } from 'alemonjs';

const event = createEvent({
  event: e, // 原始事件
  selects: ['message.create'], // 事件类型过滤
  regular: /pattern/, // 正则匹配 MessageText
  prefix: '/cmd', // 前缀匹配 MessageText
  exact: '/cmd' // 精确匹配 MessageText
});

// 返回扩展后的事件对象，附带匹配布尔值：
event.selects; // true: 事件类型匹配
event.regular; // true: 正则匹配成功
event.prefix; // true: 前缀匹配成功
event.exact; // true: 精确匹配成功
```

**标准过滤模式**：

```typescript
export default async (e, next) => {
  const event = createEvent({ event: e, selects: ['message.create'] });
  if (!event.selects) {
    next(); // 事件类型不匹配，跳过
    return;
  }
  // 处理...
};
```

## MessageDirect（主动消息）

不依赖事件上下文，主动向频道或用户发送消息。

```typescript
import { MessageDirect, Format } from 'alemonjs';

const direct = MessageDirect.create();

// 向频道发送
await direct.sendToChannel({
  SpaceId: string, // 空间 ID（框架统一标识，非原始 ChannelId）
  format: Format,
  replyId: string
});

// 向用户私信
await direct.sendToUser({
  OpenID: string, // 用户 ID
  format: Format
});
```
