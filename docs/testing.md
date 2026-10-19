# 应用测试（alemonjs/testing）

从 2.1.112 起，`alemonjs/testing` 提供离线测试环境。测试工具不依赖 Jest/Vitest，以下示例使用 Node.js 内置的 `node:test`。需要支持 `--import` 的 Node.js（建议 Node.js 22 或更新版本）。

```sh
yarn add -D tsx
node --import tsx --test test/*.test.ts
```

无需启动机器人或提供平台账号。真实的 hooks、Format、路由、中间件与 Context 可以参与执行；平台动作在传输之前由测试实例接管。测试工具不会替换你的数据库或 HTTP 客户端，项目业务依赖仍应使用依赖注入或测试运行器的 mock。

## 测试一个处理器

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createResult, ResultCode } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import hello from '../src/response/hello';

test('向被提及的用户问好', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  app.actions.on('mention.get', () => [createResult(ResultCode.Ok, 'OK', [{ UserId: '001', UserName: '宋玉' }])]);

  const result = await app.runHandler(
    hello,
    app.events.groupMessage({
      text: '/hello',
      userId: 'player',
      groupId: 'group-1'
    })
  );

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].text, 'hello, 宋玉!');
  assert.equal(result.messages[0].target?.targetId, 'group-1');
});
```

`runHandler(handler, event, appName?)` 支持函数、模块的 `default` 导出、`onResponse` 和 `onMiddleware` 的处理器链。尊重事件选择和 `return true`/`next()` 语义，返回 `nextCalls`。它不会执行指令路由或全局中间件；测试这些行为应使用 `mount` + `dispatch`。

处理器应 `await message.send()`，以便业务代码处理发送结果。测试工具也会等待当前执行中已经发起的框架发送动作（包括 `void message.send()`）。

## 模拟动作和原生 API

```ts
app.actions.on('message.send', () => [createResult(ResultCode.Fail, '平台拒绝发送', null)]);
app.actions.on('mention.get', request => {
  // request 为真实 hooks 构造的动作请求。
  return [createResult(ResultCode.Ok, 'OK', [])];
});
app.apis.on('chat.postMessage', request => {
  // useClient().chat.postMessage(...) 的参数在 request.payload.params。
  return [createResult(ResultCode.Ok, 'OK', { id: 'message-1' })];
});
```

- `message.send` 默认返回带测试消息 ID 的成功回执，仅表示模拟平台接受请求。
- 其他动作和原生 API 默认报 `Unmocked action/api`，即使 hook 捕获该异常，也会使测试执行失败。
- mock 必须返回 `Result[]`。可返回失败结果、空数组，或抛异常以验证不同失败分支。
- 配置的 mock 抛出的异常会记录在动作的 `error` 中；业务可捕获处理。未被处理器捕获的异常会使测试失败。
- `actions.on`、`apis.on` 覆盖同名 mock；`remove(name)` 删除 mock；`actions.calls` / `apis.calls` 查看该类调用。
- `app.calls` 是实例整个生命周期的调用记录，`result.actions` 只属于本次执行，包含动作和原生 API，通过 `kind` 区分。

`result.messages` 记录发送尝试，包括失败的尝试。用 `result.actions[message.actionIndex].results` 或 `.error` 检查结果，不能根据数组非空认定发送成功。

消息保留 `nodes`（嵌套 Format 节点快照）、`content`（语义消息原文）、`target`，以及便于断言的 `text` 和 `commands`。`text` 使用框架的 Markdown 纯文本转换；它不代表某个平台最终显示效果。检查气泡结构时应断言 `nodes`，不要只检查展开后的文字。

## 测试真实路由与中间件

```ts
import router from '../src/router';

await app.mount({ responseRouter: router }); // router 若为 Router 实例则传 router.define
const result = await app.dispatch(app.events.groupMessage({ text: '/签到' }));
```

`mount(register, lifecycle?, name = 'main')` 接收与应用 `register()` 相同的注册对象，并按顺序执行 `onCreated`、`onMounted` 和 `onReady`。支持 `responseRouter`、`middlewareRouter`、`responseContent` 和 `middlewareContent` 等已有注册项。`defineResponse` / `defineMiddleware` 返回的是路由注册定义，应传入 `mount({ response: definition })` / `mount({ middleware: definition })`，而不是传给 `runHandler`。也可以直接传入 `defineChildren(...)` 的应用定义，执行其工厂、register 和生命周期。不会自动扫描项目文件或启动 HTTP 服务器；`koaRouter` 的 HTTP 请求测试需要独立的 HTTP 测试环境。

`dispatch(event)` 执行真实生产事件管线：过滤/去重/频率限制、订阅、中间件、活跃 Context、路由与响应。`reasons` 记录真实结束原因；没有匹配处理器时消息数组为空。应用错误回调可能按生产规则吞掉异常，但测试默认仍报告被框架捕获的错误。测试错误恢复时可设置 `failOnError: false`，并检查 `result.errors`、输出及后续动作。

默认保留生产去重和频率规则。事件工厂每次生成唯一的 MessageId。连续测试同一用户的独立指令时，可通过 `config.processor.repeated_user_time: 0` 关闭旧版用户间隔，或推进时钟。测试去重时显式重用同一个 MessageId。

挂载应在投递事件之前完成。`unmount(name?)` 执行应用释放回调并注销该应用。`dispose()` 等待已开始的执行、执行应用释放回调、释放本实例的 Context、框架调度和配置。始终在 `t.after`/`afterEach` 中调用它。

## 多轮会话与虚拟时间

```ts
await app.mount({ responseContent: onboardingContent });
const first = app.events.groupMessage({ userId: 'a', text: '/继续引导' });
await app.invoke(first, () => showOnboarding(first, initialView));

const other = await app.dispatch(app.events.groupMessage({ userId: 'b', text: '/我' }));
assert.equal(other.context.claimed, false);

await app.clock.advance(31 * 60_000);
const expired = await app.dispatch(app.events.groupMessage({ userId: 'a', text: '/我' }));
assert.equal(expired.context.claimed, false);
```

`invoke(event, callback, appName?)` 绑定真实事件上下文，用于打开 Context 或调用自定义入口。`clock.advance(ms)` 推进当前实例的框架时间并运行到期的框架 timeout/interval，返回本次产生的消息与动作；`clock.now()` 和 `clock.pending` 可用于断言。

虚拟时钟不修改全局 `Date.now()`，不会推进原生 `setTimeout`、第三方库或自定义服务的时钟。业务自己的时钟应单独注入。Cron 使用真实 cron 库，虚拟时钟模式下明确拒绝注册；测试 cron 可用 `createTestApp({ clock: false })`，或直接单测对应业务回调。`timeoutMs` 是真实时间的执行/释放上限，默认 5000ms，不会被虚拟时间推进。

不要在一个 `dispatch()` 中等待未来虚拟定时器后，再等待该 dispatch 完成才推进时钟；应启动执行、推进时钟，再等待执行完成。框架不会等待任意用户创建的后台任务。已超时的用户 Promise 无法被 JavaScript 强制取消，应通过自己的 AbortSignal 清理外部工作。

## 项目依赖如何处理

框架不应提供认识 `runRobotBusiness`、Axios、游戏数据库的专用 mock。对于只验证展示的测试，建议将业务调用作为工厂参数：

```ts
// 工厂模块不在运行时导入庞大的业务依赖；类型使用 import type。
export function createCheckinHandler(runBusiness: RunBusiness) {
  return onResponse(selects, async event => {
    const loaded = await runBusiness(event);
    // 保留真实 useMessage、FormatGui 与结果展示。
  });
}

// 生产入口
export default createCheckinHandler(realRunBusiness);

// 测试
const handler = createCheckinHandler(async () => partialFailureFixture);
const result = await app.runHandler(handler, app.events.groupMessage());
assert.ok(result.messages[0].commands.includes('/新人签到'));
```

`app.run(callback)` 可在实例环境中创建依赖或调用 `getConfig()`；`configure(config)` 替换实例内存配置。配置不会读取/写入 YAML，也不会合并生产启动选项。模块在导入时缓存的配置、业务单例、`process.env`、第三方状态及 Node 模块缓存不会自动隔离，仍应避免模块顶层读取配置，或为项目服务提供工厂。

## 隔离与验证范围

不同测试实例使用各自的配置、应用注册、Context/队列、框架 State/订阅、Expose、去重、消息上下文和限流服务、框架调度与动作执行器。支持同进程并发实例及并发事件；每次执行的动作记录独立。已注册的同一 Context 使用真实队列规则处理并发事件。

测试会使用真实 logger；Node 测试进程结束时如需关闭日志，可在文件级 `after` 中调用 `shutdownLogger()`，不要在每个用例中关闭共享 logger。

推荐三层验证：纯业务单元测试检查规则；离线框架测试检查事件到动作的行为；少量真实平台测试检查权限、协议兼容与最终排版。离线测试通过不等于平台账号真实发送成功，也不能证明数据库事务或服务端结算正确。
