# [ALemonJS](https://alemonjs.com)

专用于开发聊天机器人的 Node.js 框架，它提供了完整的事件驱动架构来处理各种聊天平台的消息和交互。

官网文档 https://alemonjs.com

插件能力与 AI 工具调用见 [Expose](./docs/expose.md)。

## 应用启用与加载顺序

新配置以模块名作为唯一 key，在模块内部设置启用状态和加载序号：

```yaml
apps:
  '@example/database':
    enabled: true
    order: 10
  '@example/business':
    enabled: true
    order: 20
  '@example/optional':
    enabled: false
    order: 30
```

`enabled` 默认 `true`，`order` 为安全整数，省略时使用声明位置（从 0 开始）。建议所有模块显式填写序号，按 10、20、30 留出插入空间。序号越小越先加载，同序号保持声明顺序。框架等待前一个模块初始化结束再加载下一个；主应用仍先于这些模块加载。序号不代表依赖检查，也不保证失败的模块已就绪。

旧版 `模块名: true/false` 和名称数组仍可读取，后续新增配置统一使用上述模块映射。禁用模块保留序号，桌面管理入口启用、禁用时不会丢失其他模块配置。无效条目警告并跳过，字符串 `"false"` 不会被当作启用。`alemonc add/remove apps` 同步使用模块映射，保留已有模块的序号；精确调整序号请编辑 YAML。

## Router DSL 前缀空格

```ts
const commands = router.group({
  routeText: {
    prefixes: ['/修仙'],
    stripPrefix: true,
    allowBare: false,
    space: true
  }
});
commands.use('签到', () => import('./response/sign'));
```

`space` 默认为 `false`，要求直接拼接（`/修仙签到`）；设为 `true` 时要求前缀与指令之间存在空格或 Tab（`/修仙 签到`），不接受换行分隔。`byPlatform` 可覆盖此字段，省略时继承外层值。`allowBare` 仍独立控制无前缀输入。多个前缀重叠时优先匹配最长前缀。

兼容性注意：以前前缀后的空白会被自动去除；现在省略 `space` 会拒绝带分隔空格的写法，需要该写法的应用请显式设置 `space: true`。此能力只影响路由输入，不自动修改 Format 输出；应用级覆盖与按钮转换见下节。

运行验证：`yarn test:router-space`。

`Router.create()` 可设置默认 `routeText`，供直接 `use()`、分组和 `res()` 继承。分组或 `res()` 显式提供的 `routeText` 整体替换默认规则（`{}` 表示不限制前缀）。

```ts
const router = Router.create({
  events: ['message.create'],
  routeText: {
    prefixes: ['/修仙'],
    space: true,
    stripPrefix: true,
    allowBare: false
  }
});
router.res({ regular: /^签到$/ }, () => import('./response/sign'));
```

上述 `res` 接受 `/修仙 签到`，先处理前缀，再用 `签到` 匹配正则。处理器读取的 `MessageText` 仍是原始消息，路由上下文的 `text` 是归一化文本。无文本的非消息事件不受前缀限制；未配置 `routeText` 的 `res` 保持原有行为。`res` 也支持单独设置 `routeText` 和其中的 `byPlatform`。

## 应用强制前缀与按钮转换

```yaml
apps:
  xiuxian:
    enabled: true
    command:
      prefix: /修仙
      space: false
      format:
        enabled: true
        match: '^[/#＃!！]\s*'
        replacement: ''
```

应用 `command` 覆盖 Router、分组、res 的文本前缀规则，禁止旧前缀和裸指令；`space` 默认 false。不配置 command 时保持原有规则。配置错误会抛出包含应用名的错误，不能静默回退。

`format.enabled` 默认为 false。开启时必须提供有效正则 match，replacement 默认空字符串，支持 JavaScript 替换捕获组语法。仅匹配位置为开头时，先替换一次，再添加 prefix 和可选空格；未匹配则保持原样。上述配置将 `/签到`、`#签到` 转为 `/修仙签到`。可用 `match: '^启动游戏::'` 适配特殊格式。

转换覆盖发送管线中的 Format Button 和 MD.button（含结构化嵌套），只处理 command 类型或默认类型的 data；link、call、标题、文本、rawData 不变。对消息副本操作，重复发送同一个 Format 不累加前缀。已经完整编码的按钮可设置 `commandTarget: false` 保持原样；跨应用按钮设置 `commandTarget: '目标模块名'` 使用目标应用的配置。目标未配置转换时保持原样。无需 sourcePrefixes。

规则按发送和匹配时的应用上下文读取；无应用上下文时不猜测应用。配置输出转换正则时，应覆盖该应用实际使用的旧按钮格式；普通说明文本中的命令不会自动改写。

验证：`yarn test:command-policy`。

强制前缀校验始终依据当前原始 MessageText，旧 `__route` 不作为跳过校验的凭据。调用 `router.dispatch()` 重新派发消息时，MessageText 也必须符合当前应用的完整前缀规则。res 在前缀与正则匹配成功后才加载处理器；非文本事件沿用框架事件分类，不执行文本匹配。框架参数错误及 fallback 提示会使用应用级完整前缀，普通业务文案仍不自动改写。

路由控制流：res 中参数 next 与 useEvent() 返回的 next 共用放行状态，保留布尔参数且重复调用只放行一次。DSL 中参数 next 推进内部处理链；Hook next 在未改写消息时保留外层放行语义，改写后推进重新派发。最后一个 importer 改写 MessageText 并调用 next 时，框架等待下游完成后重新解析当前消息，并遵循 redispatch.maxDepth；强制前缀仍需满足，不使用旧 \_\_route 绕过校验。

直接 match/dispatch、挂载派发与自动重新派发共用目标分组的事件、平台、routeText 和参数匹配。重新派发使用剩余次数：入口 maxDepth 设置初始预算（默认 3），每次跳转减 1；后续分组只可收紧剩余预算，不能增加。maxDepth: 0 允许当前处理器执行但禁止继续跳转，maxDepth: 5 允许最多五次跳转，不再被默认值 3 截断。
