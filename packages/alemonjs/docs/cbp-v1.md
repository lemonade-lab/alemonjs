# CBP v1

## 1. 定位

CBP v1 是 `packages/alemonjs` 当前版本下已经落地的协议标准。

它解决的是 4 件事：

- 固定统一 envelope
- 停止通过旧字段猜消息类型
- 固定 `event / action / api / control` 四类语义
- 为未来新接入端提供稳定协议面

CBP v1 只描述协议层，不绑定具体传输层。

---

## 2. 当前边界

CBP v1 当前适用范围：

- `packages/alemonjs` 内核
- 未来新的平台实现或多语言接入端

CBP v1 当前**不要求**现有 `@alemonjs/*` 平台包迁移。

现有平台包继续通过兼容桥工作，详见：

- [CBP Compatibility](./cbp-compatibility.md)

---

## 3. 角色

CBP v1 当前只定义 3 个正式角色：

- `platform`
- `app-client`
- `server`

### `platform`

负责：

- 接收平台原生事件
- 转换为标准 `event`
- 执行 `action` / `api`

### `app-client`

负责：

- 消费 `event`
- 发起 `action` / `api`

### `server`

负责：

- 连接管理
- 消息路由
- 设备 / 频道分发

---

## 4. Envelope

所有 CBP 消息都使用统一 envelope：

```ts
type CBPEnvelope = {
  protocol: 'cbp';
  version: 1;
  type: 'event' | 'action.req' | 'action.res' | 'api.req' | 'api.res' | 'control';
  id: string;
  replyTo?: string;
  timestamp: number;
  source: CBPEndpoint;
  target?: CBPEndpoint;
  payload?: unknown;
  error?: CBPError;
  meta?: Record<string, unknown>;
};
```

### 字段说明

- `protocol`
  - 固定为 `cbp`
- `version`
  - 当前固定为 `1`
- `type`
  - 消息类型
- `id`
  - 当前消息唯一 ID
- `replyTo`
  - 当消息是回复时，指向原始请求 `id`
- `timestamp`
  - 统一使用毫秒时间戳
- `source`
  - 消息来源
- `target`
  - 消息目标，可为空
- `payload`
  - 业务负载
- `error`
  - 协议级错误信息
- `meta`
  - 扩展字段

---

## 5. Endpoint

```ts
type CBPEndpoint = {
  role: 'platform' | 'app-client' | 'server';
  deviceId?: string;
  appName?: string;
  platform?: string;
};
```

### 当前正式字段

- `role`
- `deviceId`
- `appName`
- `platform`

### 当前刻意不进入正式核心协议的字段

以下字段如果当前实现需要，应先留在 `payload` 或 `meta` 中：

- `instanceId`
- `shardKey`
- `guildId`
- `channelId`
- `openId`
- `userId`

---

## 6. 消息类型

### 6.1 `event`

平台端发给应用端的标准事件。

```ts
type CBPEventPayload = {
  name: string;
  event: Record<string, unknown>;
  raw?: unknown;
};
```

要求：

- `name` 必填，例如 `message.create`
- `event` 必填，为归一化后的事件对象
- `raw` 可选，用于保留平台原始负载

### 6.2 `action.req`

应用端请求平台端执行标准行为。

```ts
type CBPActionRequestPayload = {
  action: string;
  input: Record<string, unknown>;
};
```

### 6.3 `action.res`

平台端返回行为执行结果。

```ts
type CBPActionResponsePayload = {
  results: CBPResult[];
};
```

### 6.4 `api.req`

应用端请求平台端调用底层接口通道。

```ts
type CBPApiRequestPayload = {
  api: string;
  input: Record<string, unknown>;
};
```

### 6.5 `api.res`

平台端返回接口调用结果。

```ts
type CBPApiResponsePayload = {
  results: CBPResult[];
};
```

### 6.6 `control`

保留给协议层控制用途。

当前内核已能识别 `control`，但不把历史 `sync.env` 等 Node 细节写入正式标准。

---

## 7. 结果与错误

```ts
type CBPResult = {
  code: number;
  message: string;
  data?: unknown;
};

type CBPError = {
  code: string;
  message: string;
  details?: unknown;
};
```

约定：

- `results` 表示业务执行结果
- `error` 表示协议级失败或不可恢复错误

---

## 8. Action / API 业务语义

### `action`

`action` 表示：

- 由应用端发起
- 由平台端执行
- 具有跨平台业务语义
- 应尽量稳定、可文档化、可类型化

一句话：

**`action` 是跨平台标准能力。**

### `api`

`api` 表示：

- 由应用端发起
- 由平台端或客户端适配层执行
- 更接近原始接口调用或逃生口
- 不要求具备统一跨平台业务语义

一句话：

**`api` 是底层接口通道。**

---

## 9. 命名规则

标准命名统一使用：

`domain.verb`

必要时再加作用域：

`domain.verb.scope`

例如：

- `message.send`
- `message.send.channel`
- `message.send.user`
- `media.send.channel`
- `message.forward.user`

### domain 约定

推荐使用单数域名：

- `message`
- `guild`
- `channel`
- `member`
- `role`
- `reaction`
- `media`
- `history`
- `permission`
- `request`
- `user`
- `me`

### verb 约定

推荐动词：

- `get`
- `info`
- `list`
- `create`
- `update`
- `delete`
- `send`
- `upload`
- `add`
- `remove`
- `assign`
- `search`
- `mute`
- `ban`
- `unban`
- `kick`

---

## 10. 当前标准 action 名称表

### 消息

- `message.send`
- `message.send.channel`
- `message.send.user`
- `message.get`
- `message.edit`
- `message.delete`
- `message.pin`
- `message.unpin`
- `message.forward.channel`
- `message.forward.user`
- `message.intent`

### 提及与反应

- `mention.get`
- `reaction.add`
- `reaction.remove`
- `reaction.list`

### 文件与媒体

- `file.send.channel`
- `file.send.user`
- `media.upload`
- `media.send.channel`
- `media.send.user`

### 公会 / 频道 / 角色

- `guild.info`
- `guild.list`
- `guild.update`
- `guild.leave`
- `guild.mute`
- `channel.info`
- `channel.list`
- `channel.create`
- `channel.update`
- `channel.delete`
- `channel.announce`
- `role.list`
- `role.create`
- `role.update`
- `role.delete`
- `role.assign`
- `role.remove`

### 成员与用户

- `member.info`
- `member.list`
- `member.search`
- `member.kick`
- `member.ban`
- `member.unban`
- `member.mute`
- `member.admin`
- `member.card`
- `member.title`
- `user.info`

### Bot 自身

- `me.info`
- `me.guilds`
- `me.threads`
- `me.friends`

### 历史 / 权限 / 请求

- `history.list`
- `permission.get`
- `permission.set`
- `request.friend`
- `request.guild`

---

## 11. 当前标准 api 名称表

当前正式标准 API 名称只保留：

- `client.api`

其语义是：

- 通过 `payload.key` 表达底层调用路径
- 通过 `payload.params` 传递位置参数
- 通过 `payload.event` 提供当前事件上下文

---

## 12. 类型来源

为了减少命名漂移，当前内核已经把标准名称提成了显式类型：

- [src/types/actions.ts](../src/types/actions.ts)
  - `MessageActionName`
  - `MemberActionName`
  - `GuildActionName`
  - `ChannelActionName`
  - `RoleActionName`
  - `MediaActionName`
  - `StandardActionName`
- [src/types/apis.ts](../src/types/apis.ts)
  - `StandardApiName`

新增标准能力时，应先更新这两处类型，再补 hook、helper 和文档。

---

## 13. 当前代码实现映射

当前 `packages/alemonjs` 内核里，CBP v1 已经落在这些文件上：

- [src/common/cbp/typings.ts](../src/common/cbp/typings.ts)
  - 定义 `CBPEnvelope`、`NormalizedCBPMessage`
- [src/common/cbp/normalize.ts](../src/common/cbp/normalize.ts)
  - 唯一协议转换层
- [src/application/runtime/cbp/connects/client.ts](../src/application/runtime/cbp/connects/client.ts)
  - 入站消息标准化后再分发
- [src/core/cbp/server/main.ts](../src/core/cbp/server/main.ts)
  - 服务端基于 normalized 进行路由
- [src/application/runtime/cbp/processor/actions.ts](../src/application/runtime/cbp/processor/actions.ts)
  - action request / reply 发送层
- [src/application/runtime/cbp/processor/api.ts](../src/application/runtime/cbp/processor/api.ts)
  - api request / reply 发送层
- [src/platform/cbp-platform.ts](../src/platform/cbp-platform.ts)
  - 旧平台包兼容桥

---

## 14. 不进入 V1 正式标准但仍在内核保留的内容

以下内容当前仍存在于实现里，但不属于 V1 正式标准：

- `active = 'sync'`
- `activeId`
- `sync.env`
- legacy `actionId / apiId`
- 旧平台包的 `data.payload.*` 回调结构

这些都属于兼容层或 Node 内部实现细节。

---

## 15. 一句话结论

CBP v1 在当前版本中的核心约束是：

- 用 `CBPEnvelope` 固定协议壳
- 用 `event / action / api / control` 固定协议语义
- 用 `domain.verb(.scope)` 固定 action 命名
- 用兼容桥保证旧平台包零改动继续工作
