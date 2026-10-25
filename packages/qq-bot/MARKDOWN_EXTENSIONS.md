# QQ 专用 Markdown 扩展

参考 [Markdown 扩展语法](https://docs.mi65.cn/develop/api-v2/server-inter/message/type/markdown-extension.html)。这些属于 QQ 特殊 Markdown 语法，不是 alemonjs 通用 Markdown 能力。

专用入口 `@alemonjs/qq-bot/markdown` 提供纯字符串工具 `QQMarkdown`，也可从 `@alemonjs/qq-bot` 导入。它不修改 `Format.createMarkdown()`，不增加通用节点、平台判断或自动降级协议。

```ts
import { Format, useMessage } from 'alemonjs';
import { QQMarkdown } from '@alemonjs/qq-bot/markdown';

// 仅在确认目标是支持这些语法的 QQ Markdown 会话时使用。
const md = Format.createMarkdown()
  .addTitle('今日进度')
  .addContent(QQMarkdown.taskList({ text: '已完成任务', checked: true }, { text: '未完成任务' }))
  .addText('质量能量等价公式：')
  .addContent(QQMarkdown.math('E = mc^2'))
  .addContent(QQMarkdown.math(String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`, { block: true }))
  .addContent(QQMarkdown.underline('下划线'))
  .addContent(QQMarkdown.color('红色文字', 'red'))
  .addContent(QQMarkdown.ruby('汉', 'hàn'))
  .addContent(QQMarkdown.boxed('重点'))
  .addContent(QQMarkdown.cancel('划除'));

const [message] = useMessage();
await message.send({ format: Format.create().addMarkdown(md) });
```

也可将返回字符串直接组合后交给 `addMarkdownOriginal()`。这些结果都是字符串，经现有原始内容入口发送，普通 Markdown 渲染规则不变。

| QQ 专用方法                         | 生成内容                                    |
| ----------------------------------- | ------------------------------------------- |
| `taskList({ text, checked? }, ...)` | `- [x]` / `- [ ]`，前后留空行               |
| `math(latex, { block? })`           | `$...$`；块公式的 `$$` 各占一行，前后留空行 |
| `underline(text)`                   | `\underline{\text{...}}`                    |
| `color(text, color)`                | `\color{color}{\text{...}}`                 |
| `ruby(text, annotation)`            | `\overset{\text{annotation}}{\text{text}}`  |
| `boxed(text)`                       | `\boxed{\text{...}}`                        |
| `cancel(text)`                      | `\cancel{\text{...}}`                       |

`math()` 接收不带外层 `$` 的源码，用 `String.raw` 保留反斜杠，框架正常执行 JSON 序列化。文字效果方法会转义 LaTeX 控制字符。任务项换行转为空格，空任务列表返回空串；标记仅用于显示，不是可回调的复选框。颜色参数接受名称或 `#RGB` / `#RRGGBB`，客户端是否支持由平台决定。

这些工具不解析、执行或本地渲染 LaTeX，也不保证所有 QQ 客户端都支持。需要 Markdown 权限和目标客户端能力。多平台业务应按目标平台选择内容；非 QQ 平台或纯文本模式应由业务提供普通文本，不会自动把这些原始语法转换成通用内容。

通用 `addStrikethrough()`、列表、文本等维持原有行为。此前修复的 enter 场景限制及 input 长度规则不受影响。
