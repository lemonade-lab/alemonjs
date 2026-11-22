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

## 应用包热插拔与热更新

在机器人应用进程内调用下列 API，参数是已安装的应用包名，支持 `@scope/name`。

```ts
import { loadAppPackage, reloadAppPackage, unloadAppPackage } from 'alemonjs';

await loadAppPackage('@example/business');
await reloadAppPackage('@example/business'); // 构建产物写入磁盘后调用
await unloadAppPackage('@example/business');
```

这些操作即时生效，重启后仍按 `apps` 配置加载。每次热插拔或重载都会按当前 `apps.order` 更新事件处理顺序。启动时禁用的包也可以手动加载，并按配置插入对应位置。同序号按配置声明顺序，主应用排在最前，未配置的包排在配置项之后并保持首次挂载顺序。同一包的操作按调用顺序执行，重复加载已就绪的包会返回当前应用。卸载会移除框架登记的响应、中间件、HTTP 路由、定时任务、事件订阅、交互上下文和 Expose 注册，并等待 `onDispose` 和旧版 `unMounted` 完成。应用自行创建的连接、原生定时器等资源应在 `onDispose` 中关闭。

热更新和卸载后的重新挂载要求支持 `module.registerHooks` 的 Node.js（22.15+）及 ESM 应用包。更新会重新加载包内代码，外部依赖沿用进程已有的模块实例。重载期间该应用会短暂停服，已开始执行的请求可以继续。新版在 `onReady` 完成后才开始接收新事件。若新版本初始化失败，API 会抛出错误，应用进入 `failed` 状态；修正文件后可再次加载。调用方负责触发更新，例如在构建成功后由开发工具调用 API。

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

## 消息访问范围

`processor.access` 设置框架范围，`apps.<模块名>.access` 设置单个应用范围。两层都须通过。规则适用于消息和按钮交互，通知和生命周期事件继续分发。

```yaml
processor:
  access:
    deny:
      - { platform: onebot, channelId: '999999' }
apps:
  xiuxian:
    enabled: true
    access:
      allow:
        - { platform: onebot, botId: '12345', channelId: '123456' }
        - { scope: private, platform: onebot, botId: '12345' }
```

每条规则可匹配 `platform`、`botId`、`channelId` 和 `scope`。同一条规则内的字段均须匹配，每个列表内匹配任意一条即可。`scope` 可用 `channel` 或 `private`。指定 `channelId` 时必须指定平台，ID 请写成字符串。同一平台的多台机器人可以用 `botId` 进一步区分。

每层先检查 `deny`，再检查 `allow`。省略 `allow` 时默认放行，空 `allow: []` 拒绝该层所有消息和按钮交互。通过范围检查后，消息仍需满足配置的 @ 条件。

```sh
alemonc config check
alemonc config explain --platform onebot --bot-id 12345 --channel-id 123456 --app xiuxian
```

`check` 检查 YAML、访问规则和 @ 配置字段。访问规则的错误会给出字段路径，运行时会拒绝无效的热更新并保留此前配置。两个命令都支持 `--file`。`explain` 根据文件模拟框架和模块的访问及 @ 规则决策，可用 `--private`、`--mentioned` 或 `--interaction` 指定事件形态。限流、实际模块加载状态和启动参数覆盖由运行时决定。

设置 `processor.accessDiagnostics: true` 可在运行时记录被拒事件的消息 ID、目标、模块和规则路径，诊断条目省略消息正文。

## 子频道仅 @ 机器人时回复

在 `alemon.config.yaml` 中配置。按以下顺序检查，遇到 `true` 就启用限制。所有字段默认 `false`，显式设为 `false` 和省略字段都会继续检查下一层。

1. 框架级 `processor.channelMentionOnly`
2. 指定子频道 `processor.channelMentionOnlyByChannel.<子频道 ID>`
3. 模块级 `apps.<模块名>.channelMentionOnly`
4. 指定模块的指定子频道 `apps.<模块名>.channelMentionOnlyByChannel.<子频道 ID>`

```yaml
processor:
  channelMentionOnlyByChannel:
    '123456789': true
    '987654321': false
apps:
  xiuxian:
    enabled: true
    channelMentionOnly: true
  assistant:
    enabled: true
    channelMentionOnlyByChannel:
      '111222333': true
```

框架的子频道包含平台上的群聊和频道消息目标。指定子频道时使用目标 ID，例如 QQ 官方机器人的群 OpenID，Discord 则使用子频道 ID。示例中，`123456789` 对所有应用要求 @，`987654321` 继续检查各模块的配置。在其他子频道，`xiuxian` 始终要求 @，`assistant` 只在 `111222333` 要求 @。主应用可用模块名 `main`。启用后，子频道消息只有被平台标记为 @ 本机器人时才会派给受限应用。私聊和按钮交互照常分发。

如果普通消息已通过入站检查，随后在去重窗口内收到同一消息 ID 的 @ 事件，框架只向此前因 @ 条件被跳过的应用补发一次。补发沿用原消息的入站额度。被框架访问规则或旧版文本、事件类型、用户禁用规则拦下的事件不会进入应用的开始和完成回调。

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
