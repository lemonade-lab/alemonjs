# [ALemonJS](https://alemonjs.com)

专用于开发聊天机器人的 Node.js 框架，它提供了完整的事件驱动架构来处理各种聊天平台的消息和交互。

官网文档 https://alemonjs.com

## Markdown 引用

`addBlockquote()` 表示一个完整的引用块，可接收字符串、`FormatMarkDown` 构建器或 Markdown 子节点数组：

```ts
import { Format } from 'alemonjs';

const md = Format.createMarkdown()
  .addText('引用前的正文')
  .addBlockquote('第一段\n\n第二段')
  .addBlockquote(Format.createMarkdown().addText('参考 ').addLink('文档', 'https://alemonjs.com').addBlockquote('嵌套引用'))
  .addText('引用后的正文');

const format = Format.create().addMarkdown(md);
// await message.send({ format });
```

- 引用内部支持多行、空段落和嵌套节点。平台负责渲染内部样式，并隔离前后正文，无需调用方补换行。
- 原有 `addBlockquote(string)` 和旧版 `Markdown.blockquote(string)` 保持可用，字符串仍沿用目标平台原有的解释方式，不新增转义。
- 构建器或数组输入会复制顶层节点数组，后续追加节点不会进入已经创建的引用；节点对象本身不深拷贝。
- 不支持原生引用的平台使用带 `>` 标记的文本降级。引用属于内容排版，回复某条消息仍使用 `replyId`。
- 数据中的 `MD.blockquote.value` 现在允许字符串或节点数组。自定义适配器需要递归处理数组；可从 `alemonjs/markdown` 导入无运行时初始化副作用的 `renderMarkdownBlockquote(value, renderChildren)`。新版平台适配器需搭配包含此导出入口的新版核心使用。

核心最低版本为 `2.1.108`，配套平台包声明 `alemonjs: ^2.1.108`。升级平台包时需要一起升级核心。

标题、列表、代码和引用等块级节点自动隔离前后正文；相邻行内节点仍直接拼接。引用子节点全部被隐藏时不发送空引用，显式 `addBlockquote('')` 或 `addBlockquote([])` 则保留。

仓库根目录运行 `yarn test:markdown` 可检查构建接口、各平台引用转换、QQ/Bubble 最终发送载荷和包导出入口。QQ 的原生、文本降级及媒体降级路径均保持输入顺序。

### 平台兼容范围

所有平台均接受旧字符串引用和新的子节点数组；平台不支持的样式、图片或交互会按各自规则降级。

| 平台           | 引用处理                                     | 已接入的路径                                  |
| -------------- | -------------------------------------------- | --------------------------------------------- |
| QQ Bot         | 原生 Markdown；可配置纯文本降级              | 普通消息、主动发送、媒体消息降级              |
| Discord        | Markdown，递归转换子节点                     | 普通消息、主动发送、消息编辑                  |
| KOOK           | KMarkdown，递归转换子节点                    | 普通消息、主动发送、消息编辑                  |
| Bubble         | 原生 Markdown 及文本降级                     | 频道、私聊共用发送逻辑                        |
| Telegram       | 带引用标记的纯文本；发送接口未开启 HTML 解析 | 普通消息、图片说明、主动发送、消息编辑        |
| OneBot         | 带引用标记的纯文本                           | 普通消息、主动发送；引用内 mention 保留为文本 |
| Milky          | 带引用标记的纯文本                           | 普通消息、主动发送、转发节点转换              |
| Wechaty        | 带引用标记的纯文本                           | 普通消息、主动发送                            |
| WeChat ClawBot | 可读文本，递归转换子节点                     | 私聊回复、主动私聊；平台未提供群发送路径      |
| 企业微信       | Markdown 消息中的可读引用内容                | 上下文回复、主动发送                          |
| 抖音           | 可读文本；图片和按钮在引用内降级             | SDK 普通/主动/目标发送、网关桥接              |
| 抖音机器人     | 可读文本                                     | IM 消息发送                                   |

引用内可以使用 `.addList('条目', { index: 2, text: '有序条目' })`，旧 `MD.listItem` 节点仍可直接传入；链接省略 URL 时保留显示文字。降级转换的 `hideUnsupported` 选项会递归应用于引用内部。

以上为代码路径和离线转换测试覆盖范围，不代表已完成各平台账号实发验证。自定义适配器也需要处理递归节点。

## 可选的 CBP 文件通知

为不使用父子 IPC、也不连接 WebSocket 的本地进程提供登录状态通知。默认关闭；仅在启动 AlemonJS 的环境中显式设置后生效：

```bash
ALEMON_CBP_FILE_TRANSPORT=1
ALEMON_CBP_FILE_DIR=/var/run/alemon/cbp # 可选，默认 .alemon/cbp
```

启用后目录中会有：

- `status.json`：原子更新的当前 CBP、登录和连接快照；晚启动的消费者先读取它。
- `events.jsonl`：只包含 `login.qrcode`、`login.success`、`connection.ready` 的短事件缓冲。
- `qrcode/<LoginId>.png`：当前二维码；二维码刷新或登录完成后自动清理旧文件。

事件文件默认最多保留 200 条且不超过 1 MiB。可用 `ALEMON_CBP_FILE_MAX_EVENTS`（最大 1000）和 `ALEMON_CBP_FILE_MAX_BYTES`（最大 10 MiB）调整上限。二维码 base64 不会写入事件或快照，消费者使用 `QRCode.imagePath` 或 `QRCode.url`。
