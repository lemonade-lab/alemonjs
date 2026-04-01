# AlemonJS 架构参考

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                   开发者应用层                        │
│  defineChildren → defineRouter → handler(response)   │
│                  defineMiddleware                     │
│  Hooks: useMessage, useMention, useSubscribe         │
│  Format: 消息构建器                                   │
└────────────────────┬────────────────────────────────┘
                     │ CBP (Cross-platform Protocol)
┌────────────────────┴────────────────────────────────┐
│                  AlemonJS Core                       │
│  事件处理器 (Event Processor)                         │
│  ├─ onProcessor (过滤/去重/重定向)                    │
│  ├─ expendMiddleware (中间件链)                       │
│  ├─ expendSubscribe (订阅生命周期)                    │
│  └─ expendEvent (响应处理)                            │
│                                                      │
│  模块加载器 (Module Loader)                           │
│  ├─ loadChildren → ChildrenApp                       │
│  └─ loadApps → 配置文件加载                           │
│                                                      │
│  通信层 (CBP)                                        │
│  ├─ Direct Channel (UDS + V8, ~20μs)                │
│  ├─ IPC Bridge (fork, ~50μs)                        │
│  └─ WebSocket (flattedJSON, ~1ms)                   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│               平台适配器层                            │
│  @alemonjs/discord  │ @alemonjs/qq-bot              │
│  @alemonjs/kook     │ @alemonjs/onebot              │
│  @alemonjs/telegram │ @alemonjs/bubble              │
└─────────────────────────────────────────────────────┘
```

## 进程模型

```
┌──────────────────┐     CBP      ┌──────────────────┐
│   Platform 进程   │ ◄──────────► │   Client 进程     │
│  (平台适配器)      │             │  (用户应用代码)     │
│  definePlatform   │             │  defineChildren    │
│  事件标准化        │             │  handler 执行      │
│  API 调用实现      │             │  hooks 处理        │
└──────────────────┘              └──────────────────┘
```

- **Platform 进程**：运行平台特定代码，连接平台 API，将原始事件标准化为 AlemonJS 事件
- **Client 进程**：运行开发者应用代码，处理事件，通过 CBP 发送 action

## 事件处理管线

```
Platform 事件到达
        │
        ▼
  onProcessor (过滤层)
  ├─ 检查 disabled_text_regular
  ├─ 检查 disabled_selects
  ├─ 检查 disabled_user_id/key
  ├─ 去重检测 (repeated_event_time)
  └─ 重定向规则 (redirect_regular)
        │
        ▼
  expendCycle (编排层)
  ├─ expendMiddleware (中间件)
  │   ├─ 文件式中间件 (旧)
  │   └─ 路由式中间件 (middlewareRouter)
  │
  ├─ expendSubscribe('create')
  │
  ├─ expendEvent (响应处理)
  │   ├─ 路由式响应 (responseRouter) ← 优先
  │   └─ 文件式响应 (response) ← 后执行
  │
  ├─ expendSubscribe('mount')
  │
  └─ expendSubscribe('unmount')
```

## 数据流

```
开发者调用 message.send({ format })
        │
        ▼
  sendAction({ action: 'message.send', payload: { event, params } })
        │
  通信优先级: Direct Channel > IPC > WebSocket
        │
        ▼
  Platform 进程收到 action
        │
        ▼
  ClientAPI.api.use.send(event, format)
        │
        ▼
  平台 SDK 发送到聊天平台
```

## ChildrenApp 生命周期

```typescript
const App = new ChildrenApp(appName);

// 1. 加载模块
const mod = await import(mainPath);

// 2. 获取 callback
const app = mod.default.callback;

// 3. onCreated - 初始化
await app.onCreated?.();

// 4. register - 注册路由/中间件
const res = await app.register?.();
App.register(res); // 存储 responseRouter, middlewareRouter 等

// 5. App.on() - 挂载到全局 store
App.on();

// 6. onMounted - 挂载完成
await app.onMounted?.(store);

// 7. (运行中处理事件...)

// 8. unMounted - 异常或卸载时
await app.unMounted?.(error);
```

## 全局状态管理

```typescript
global.alemonjsCore = {
  storeState: {}, // 功能开关 [已废弃]
  storeStateSubscribe: {}, // 状态订阅 [已废弃]
  storeSubscribeList: {
    create: Map<EventKeys, SinglyLinkedList>, // create 阶段订阅
    mount: Map<EventKeys, SinglyLinkedList>, // mount 阶段订阅
    unmount: Map<EventKeys, SinglyLinkedList> // unmount 阶段订阅
  },
  storeChildrenApp: {
    [appName]: ChildrenApp // 所有注册的子模块
  }
};
```

## 配置系统

配置文件 `alemonjs.config.yml`（YAML 格式）：

```yaml
# 禁用匹配正则
disabled_text_regular: '^(test|debug)'

# 禁用特定事件类型
disabled_selects:
  message.create: false

# 禁用特定用户
disabled_user_id:
  '123456': true

# 重定向规则
redirect_regular: '^redirect'
redirect_target: 'message.create'

# 处理器配置
processor:
  repeated_event_time: 1000 # 事件去重窗口 (ms)
  repeated_user_time: 5000 # 用户去重窗口 (ms)

# 子应用加载
apps:
  my-plugin: true
  debug-tool: false
```

配置通过 `ConfigCore` 类管理，支持：

- 100ms 防抖变更通知
- 合并优先级：argv > 文件 > 默认值
- 监听器：`cfg.listen(callback)`
