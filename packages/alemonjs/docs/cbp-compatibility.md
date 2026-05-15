# CBP Compatibility

## 目标

CBP v1 在 `alemonjs` 内核中逐步落地，但**现有平台包不是迁移对象**。

当前正式标准见：

- [CBP v1](./cbp-v1.md)

这份说明固定 3 条边界：

1. 不修改任何现有 `@alemonjs/*` 平台包
2. 旧 `cbpPlatform` API 永久兼容
3. CBP v1 只在 `packages/alemonjs` 内核和未来新接入端中生效

---

## 平台包兼容面

现有平台包继续使用这些旧接口：

- `cbp.send(eventObject)`
- `cbp.onactions((data, consume) => {})`
- `cbp.onapis((data, consume) => {})`

也就是说，平台包仍然可以继续依赖这些旧字段：

- `data.action`
- `data.payload.*`
- `data.actionId`
- `data.apiId`

平台包不需要理解：

- `CBPEnvelope`
- `replyTo`
- `type: 'action.req' | 'api.req'`
- `NormalizedCBPMessage`

---

## 内核升级范围

CBP v1 的升级只发生在 `packages/alemonjs` 内部：

- `cbp/connects/client.ts`
- `cbp/connects/platform.ts`
- `cbp/server/main.ts`
- `cbp/processor/actions.ts`
- `cbp/processor/api.ts`
- `cbp/normalize.ts`
- `cbp/typings.ts`

其中：

- `normalize.ts` 是唯一协议转换层
- `platform.ts` 是旧平台包的长期兼容桥
- `client/server/processor` 逐步只认 normalized / envelope

---

## 协议流转

### 事件上行

平台包继续发送标准 JS 事件对象：

`platform package -> cbp.send(eventObject)`

然后由 `cbpPlatform.send()` 在内核中封装为：

`eventObject -> CBPEnvelope(type='event')`

### action / api 下行

内核先生成 v1 request：

- `action.req`
- `api.req`

但在 `cbpPlatform` 中，会在回调前回填成平台包熟悉的旧结构：

- `NormalizedActionRequestMessage -> legacy Actions`
- `NormalizedApiRequestMessage -> legacy Apis`

所以平台包接收到的仍然是：

- `data.action`
- `data.payload`
- `data.actionId`
- `data.apiId`

---

## normalize.ts 的职责

`normalize.ts` 是唯一协议转换层，负责四类转换：

1. `CBPEnvelope -> NormalizedCBPMessage`
2. `ParsedMessage -> NormalizedCBPMessage`
3. `NormalizedActionRequestMessage -> legacy Actions`
4. `NormalizedApiRequestMessage -> legacy Apis`

以及：

- `Actions -> action.req envelope`
- `Apis -> api.req envelope`
- `eventObject -> event envelope`
- `legacy reply data -> action.res/api.res envelope`

新旧协议转换不应该散落到其它文件。

---

## ParsedMessage 的定位

`ParsedMessage` 仍然保留，但已经降级为：

- legacy compatibility type

新代码应优先使用：

- `CBPEnvelope`
- `NormalizedCBPMessage`

---

## 对未来新接入的意义

未来如果要支持：

- 新平台实现
- 多语言平台端
- 多语言 worker
- 跨进程 / 跨节点新接入

这些新接入应优先直接实现：

- `CBPEnvelope`

而不是再去模仿旧 `ParsedMessage` 结构。

---

## 一句话结论

CBP v1 的升级策略不是“迁移现有平台包”，而是：

**让旧平台包继续零改动运行，同时让 `alemonjs` 内核逐步以 `NormalizedCBPMessage` 和 `CBPEnvelope` 作为正式协议标准。**
