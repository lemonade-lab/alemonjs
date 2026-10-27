# Expose：插件能力与结构化工具调用

Expose 用于同一框架运行实例中的插件调用。Router 负责聊天事件、文本匹配和 `next()`；Expose 负责明确的能力调用和结果。二者可以复用业务函数，但 Expose 不接收 Router，也不自动遍历消息路由、重放事件或调用聊天 `next()`。

## 注册能力

`register()` 返回 Expose 实例，不能传配置数组。以下为完整的只读能力示例：

```ts
import { defineChildren, Expose } from 'alemonjs';

const expose = Expose.create().provide({
  name: 'example.counter',
  version: '1',
  description: '读取计数',
  actions: {
    read: Expose.action<null, { count: number }>({
      description: '返回当前计数',
      effect: 'read',
      inputSchema: { type: 'null' },
      outputSchema: {
        type: 'object',
        properties: { count: { type: 'integer', minimum: 0 } },
        required: ['count'],
        additionalProperties: false
      },
      authorize: (_input, context) => context.callerApp === 'assistant-plugin',
      handler: () => ({ count: 0 })
    })
  }
});

export default defineChildren({
  register() {
    return { expose };
  }
});
```

示例的常量只演示契约；实际游戏提供者应调用真实业务服务。`version` 是提供者声明的契约版本，当前不做自动协商或版本路由。同一个协议下每个提供者独立返回 schema，消费者必须选择具体插件并核对契约。

## 消费能力

```ts
import { Expose } from 'alemonjs';

const client = Expose.create();
const catalog = client.schema();
const result = await client.call('example.counter', 'counter-plugin', 'read', null, { timeoutMs: 5000 });
if (result.ok) {
  // result.data 是已通过提供者 outputSchema 校验的 unknown。
  // 消费方应按选定契约解码；不允许用任意泛型宣称远端结果类型。
} else {
  // result.error.code 是框架错误；outcome 描述 handler 是否开始执行。
}
```

`schema()` / `list()` 不执行 handler。它们提供发现信息，不保证当前用户获准操作。AI 适配层应只将同时包含 `inputSchema` 和 `outputSchema` 的动作转成工具，并再次执行授权检查。目录中的旧 `params` / `returns` 是文字说明，不能当成机器可校验的契约。

## 调用与结果语义

- `invoke()` 保留同步返回值、Promise 和异常方式。`list()` 返回的 `invoke()` 与它走同一执行器，新契约与授权钩子也会执行。
- `call()` 始终返回 Promise，拒绝没有完整结构化契约的旧动作。成功为 `{ ok: true, callId, data }`，框架失败为 `{ ok: false, callId, error: { code, message, outcome } }`。
- 成功仅表示 handler 正常返回且输出符合契约。业务拒绝、待确认、待结算等状态应由插件在输出 schema 中显式建模。框架不会把普通 `{ success: false }` 自动解释为执行异常。
- `outcome: 'not_started'` 表示 handler 尚未开始；`unknown` 表示已经开始，不能推断资源是否扣除或事务是否提交。授权钩子应无业务写入。
- `call()` 对未知异常只返回通用错误，不泄漏原异常内容。`ExposeError` 是有意公开的框架错误接口，提供者不要在其中放密钥或内部错误文本。
- 没有自动重试、回滚或恰好一次保证。`callId` 用于追踪，每次调用不同，不能作为业务重试的幂等编号。

框架错误包括协议／提供者／动作不存在、旧句柄失效、契约缺失、输入输出不合法、授权拒绝、执行异常、取消、超时及无效选项。

## 上下文与授权

结构化契约的 authorize 接收独立的深度只读参数快照，不能修改 handler 将要执行的参数；修改尝试导致异常时，不会开始 handler。handler 与 authorize 接收相同的只读 `ExposeCallContext`：`callId`、可选 `parentCallId`、可选 `callerApp`、`protocol`、`provider`、`action`、`signal`。也可通过 `getExposeContext()` 读取当前调用。

在插件事件及创建、注册、挂载、就绪、销毁生命周期中调用时，`callerApp` 来自框架绑定的插件身份，不需要聊天事件；嵌套 Expose 调用的直接调用者是上一级 provider。跨入另一插件的事件或生命周期后，旧 Expose／监听器身份不再覆盖新的插件身份；返回原调用范围后恢复原身份。没有所属插件上下文时该字段为空，不能凭参数里的同名字段补造身份。业务应在 `authorize` 中按所需权限决定是否允许无上下文调用。

Expose 不创建或切换聊天事件上下文，也不会自动执行 Router 中间件。新能力优先使用显式输入、Expose 上下文和纯业务服务，不依赖 `useEvent()`、`useMessage()` 或聊天 `next()`。若当前调用链原本具有事件上下文，它仍可能被旧 Hook 读取，不能把它误认为 provider 新收到的独立事件。

插件名识别不是玩家授权。UID、渠道、用户授权范围、成本确认及服务端鉴权仍由业务层验证。同进程插件能够运行任意 JavaScript，Expose 不是恶意插件安全沙箱。

## 契约范围

本轮实现并明确限制为 JSON Schema 子集，不宣称支持完整 JSON Schema：

- `null`、`boolean`、`string`、`number`、`integer`、`array`、`object`。
- 字符串支持 `enum`、Unicode 码点长度 `minLength` / `maxLength`。
- 数值支持 `minimum` / `maximum`，拒绝 NaN、Infinity；整数额外限制为 JavaScript 安全整数。
- 数组支持 `items`、`minItems` / `maxItems`；对象支持 `properties`、`required`，必须显式设置 `additionalProperties: false`。
- 支持 `description`。拒绝 `$ref`、组合类型、`pattern`、`format` 等尚未实现的关键字，不静默放行。契约嵌套深度最多 32。

注册会验证并快照契约；发现接口返回副本。新契约动作先生成数据快照，再对同一份快照校验、授权和执行；输出也先快照再校验。拒绝 getter/setter、循环引用、稀疏数组、Symbol 字段、非枚举字段及非 JSON 数据对象，不通过访问器读取参数。异步授权等待期间调用方修改原对象不会更改已捕获的输入。TypeScript 的 `Expose.action<Input, Output>()` 约束 handler 编写，运行时以 schema 为准。

## 超时、卸载与监听

`call` 支持原生 `AbortSignal` 和正整数 `timeoutMs`。选项必须是只含这两个字段的普通数据对象；空值、伪造信号、访问器和未知字段返回 `INVALID_OPTIONS`，不执行 handler。清理阶段使用已捕获的信号，不重新读取调用方可变选项。超时停止等待并通知 handler；JavaScript 同步执行不可抢占，已发出的外部请求或已提交事务不会因此撤销。handler 应将 `context.signal` 传递给支持取消的下游；嵌套调用需要显式传入这个 signal。

卸载或替换时先将旧提供者标记为不可调用，再通知正在执行的操作取消；取消回调也不能重入旧提供者。卸载或替换提供者会阻止新调用，废弃缓存的列表句柄，并向正在执行的调用发送取消信号。已开始的 `call` 返回结果未知。迟到的完成或拒绝不会触发成功通知；框架无法强制停止忽略 signal 的用户代码。

`watch` 保留旧事件结构，在正常返回且通过输出校验后触发；异步动作会等待完成。`effect: 'read'` 不通知，`write` / `unknown` 通知；未声明 effect 的旧动作沿用名称 `read` 的兼容规则。它是成功返回通知，不是数据库提交事件，也不提供完整的开始／失败审计流。旧 watch 含输入 value，敏感业务不要把它转发给模型或日志。

在事件、插件生命周期及 Expose 调用上下文注册的监听器按插件归属卸载清理；完全脱离插件上下文注册的监听器仍需显式调用 `watch()` 返回的取消函数。异步监听器失败不影响调用结果。监听器发起的新调用按监听器自身的插件归属识别，不继承被监听提供者的身份。

## 升级与验证

**兼容范围是旧调用形式和同步／异步返回方式，不是所有可观察行为保持不变。** 旧 `provide` / `invoke` 继续可用。消费者升级时必须检查三处行为变更：`schema()` 每个 provider 独立成项；异步 watch 改在成功后触发；卸载或替换后旧列表句柄失效。没有全量路由自动暴露。

运行 `yarn test:expose` 验证构建、发布类型、真实测试实例中的协议行为及旧版兼容断言；旧 Jest 套件使用专用 ESM 配置，未修改全仓默认配置。玩家授权代理、业务幂等／确认凭据、AI 工具转换器、远程调用、流式任务和全量审计事件不在本轮框架实现范围内。
