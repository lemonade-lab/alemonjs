# 消息处理、会话上下文与输入状态

这些能力使用 AlemonJS 的标准 Event 和 Hook，不需要应用直接操作 QQ SDK。全部增强功能均需显式开启；未配置时保留原有处理行为。

## 配置

在 `alemon.config.yaml` 中配置框架消息处理与 QQ 文本标准化：

```yaml
processor:
  rateLimit:
    sender: { max: 5, windowMs: 60000 }
    group: { max: 30, windowMs: 60000 }
    global: { max: 100, windowMs: 60000 }
    maxBuckets: 10000
  conversation:
    historyLimit: 50
    referenceLimit: 200
    contentLimit: 1000
    ttlMs: 1800000
    maxScopes: 100
  autoTyping:
    duration: 60
    intervalMs: 50000
    maxDurationMs: 300000

qq-bot:
  app_id: 'YOUR_APP_ID'
  secret: 'YOUR_APP_SECRET'
  textSanitizer:
    botMention: remove
    otherMentions: preserve
    faces: label
    collapseWhitespace: false
```

### 三层限流

- `sender`：每个平台、机器人、用户分别计数，跨该机器人的会话共享用户额度。
- `group`：每个平台、机器人、会话分别计数；群和频道参与，单聊与频道私信跳过。
- `global`：这个核心进程内、采用本配置的全部机器人共用总额度。

三层全部检查通过后才扣额度。被拒绝的请求不会扣其他层额度。窗口边界到期即释放；计数器容量满时拒绝新键，不通过驱逐活跃用户来绕过额度。默认不发送限流回复，事件结束原因是 `filtered`。

配置 `sender` 后，消息事件使用该窗口计数替代原来的 `processor.repeated_user_time` 用户间隔过滤，允许窗口内的短时连续请求。未配置 sender 时仍保留原有间隔过滤。重复消息过滤继续生效，其键增加了平台、机器人及会话隔离。

程序化启动选项可设置 `rateLimit.onLimit(event, decision)`，根据 `decision.tier / retryAfterMs` 发送提示；它不应再次执行原业务。独立使用 `createRateLimiter(options).check(event)` 则由应用消费返回结果。

### QQ 文本清洗

`textSanitizer` 未配置时保持原适配器的文本处理。配置 `{}` 后默认移除当前机器人标记、保留其他人的 @、保留表情，并去掉首尾空白。

| 选项               | 可选值                    | 默认     |
| ------------------ | ------------------------- | -------- |
| botMention         | remove / preserve         | remove   |
| otherMentions      | remove / preserve         | preserve |
| faces              | preserve / remove / label | preserve |
| collapseWhitespace | boolean                   | false    |

`label` 把旧表情标签转成 `[表情:ID]`，新标签有可解析名称时使用名称；不猜测 ID 对应的 Unicode emoji。连续空白默认保留，避免破坏段落、Markdown 和代码缩进。

处理结果放在 `event.MessageText`。`event.RawMessageText` 与原始 `event.value.content` 保留输入文本；结构化 `MessageMentions` 不会被删除。原始文本不会自动进入模型上下文。

## 引用、历史与模型上下文

```ts
import { useConversation, useMessage, ResultCode } from 'alemonjs';

// 在已注册的消息处理函数中：
const [conversation] = useConversation(event);
console.log(conversation.quote?.source); // index / elements / missing
console.log(conversation.history); // 不包含当前消息

// askModel 是应用自己提供的模型调用，不是框架 API。
const answer = await askModel(
  conversation.prompt({
    historyLimit: 5,
    maxChars: 12000,
    includeSender: true,
    includeQuote: true
  })
);
const [message] = useMessage(event);
const results = await message.send({ content: { text: answer } });
for (const result of results) {
  if (result.code === ResultCode.Ok) {
    await conversation.rememberReply(result.data, answer);
  }
}
```

`useConversation()` 可以省略 event，读取当前事件上下文。未开启 capture 时，history 为空，prompt 仍可表达当前消息；此时 `rememberReply` 会明确拒绝，不会偷偷创建另一套存储。

引用优先采用匹配索引的协议消息元素，再回退到已观察消息索引。协议只提供一个无索引元素时，也可作为引用正文使用，支持合并转发内容；多个不匹配元素不会被误认为引用。缺失时返回 `missing`，不编造旧消息。

索引同时保留消息 ID 与平台引用 ID。`rememberReply` 需要**当前会话已成功发送的回执和实际正文**，支持以后引用机器人的回复；不会预先记录发送失败的内容，也不会猜测平台最终发送的卡片或 Markdown 文本。

历史记录位于重复消息过滤之后、用户限流和路由响应过滤之前。因此已收到但没有触发响应的群消息也能供后续使用；禁用用户、文本禁用规则拦截的消息不记录。只能保存机器人实际收到的消息，不能恢复平台未投递的群聊历史。`useHistory().list()` 仍是平台历史查询入口，与本缓冲独立。

prompt 返回一个有字符上限的 JSON 数据包，包含发送者、引用、最近历史、当前正文和附件类型/名称/语音转写；不自动发送给模型，不读取附件内容，也不附带原始鉴权上下文。历史先从最旧项裁剪，再移除引用，最后裁剪当前正文，始终保持有效 JSON；上限小于必要元数据时明确报错。这里的上限是字符数，不是模型 token 数。内容属于用户输入，应作为数据交给模型，系统指令由应用单独管理。

## 存储与隔离

默认存储按平台、机器人、scope、接收目标隔离，群和频道即使 ID 一样也不共享记录。只在内存中保存，进程重启即清空；每个会话默认保留 50 条历史、200 条引用索引，正文最多 1000 个字符，最多保留 100 个会话，30 分钟不活动后过期。达到会话容量时淘汰最近最少访问的会话。

`createConversationService(options)` 可以独立使用；`conversation.store` 可在程序化配置中实现异步 `ConversationStore.get/set/delete`。服务按会话串行化读改写操作，限制待处理存储任务的总量，失败后不会阻塞后续任务。核心入口遇到存储故障会告警并继续正常消息处理；直接调用 service.capture 则把失败交给调用方。

外部存储仍须自行提供容量策略、持久化与多进程写入协调；进程内串行不等于跨实例事务。限流计数也属于当前核心进程。配置被替换或热重载时，对应实例会重建，原内存额度和上下文清空。

## C2C typing

`processor.autoTyping` 仅对标准目标为 QQ C2C 的消息自动触发：通过入口过滤后发送一次，随后定期续发。事件完成、消费或失败时停止续发，并有最长持续时间兜底。隐藏事件日志不会跳过资源清理或生命周期回调。

默认每次指示持续 60 秒，每 50 秒刷新，最多刷新 5 分钟。只缩短 duration 时，默认刷新间隔会自动缩短至持续时间的 90%，且不超过 50 秒。刷新不重叠；失败不打断业务。停止续发不会撤回已经展示的输入状态，平台会自行使其到期。不会为群聊或频道请求 C2C 输入状态。

如果只有某些耗时业务需要 typing，可不启用全局 autoTyping，在处理函数里明确包围任务：

```ts
const [message] = useMessage(event);
const answer = await message.withTyping(() => askModel(input), { duration: 60, intervalMs: 50000, maxDurationMs: 300000 });
```

`withTyping` 等待任务并在 finally 中清理。不要同时为同一任务启用全局自动续发和这层包装。可传 `signal` 提前停止续发；业务任务是否取消由应用自己传播 AbortSignal 决定。应用自行启动且没有等待的后台任务不属于当前事件生命周期。

## 验证

```sh
yarn test:conversation
yarn workspace @alemonjs/qq-bot test:non-channel
yarn workspace @alemonjs/qq-bot test:channel
```

测试覆盖限流窗口与容量、拒绝时的额度保持、机器人/会话隔离、有界存储、异步存储并发与失败恢复、引用回退、确认回复记录、prompt 字符预算、typing 重叠及终态清理，以及真实核心入口和 QQ 适配器。使用本地合同测试，没有真实 QQ 账号在线验收。
