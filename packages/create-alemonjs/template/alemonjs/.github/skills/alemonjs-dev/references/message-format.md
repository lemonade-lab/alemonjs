# AlemonJS 消息格式参考

## Format 类

主消息构建器，链式 API。

```typescript
import { Format } from 'alemonjs';

const format = Format.create();

// 文本
format.addText('Hello World');

// 图片
format.addImage(buffer); // Buffer
format.addImage('https://example.com/img.png'); // URL
format.addImage('base64://...'); // Base64
format.addImage('/path/to/local/file.png'); // 本地路径

// 提及用户
format.addMention(userId);

// 链接
format.addLink('https://example.com', '点击访问');

// 附件
format.addAttachment(buffer, 'file.pdf');

// 音频 / 视频
format.addAudio(buffer);
format.addVideo(buffer);

// 按钮组（传入 FormatButtonGroup 实例）
format.addButtonGroup(buttonGroup);

// Markdown（传入 FormatMarkDown 实例）
format.addMarkdown(mdInstance);

// 原始 Markdown 文本
format.addMarkdownOriginal('**bold** _italic_');

// 换行
format.addBreak();

// 吸收另一个 Format
format.absorb(otherFormat);

// 清空
format.clear();

// 获取内部数据
format.value; // DataEnums[]
```

## FormatButtonGroup

按钮组构建器。

```typescript
import { FormatButtonGroup } from 'alemonjs';

const buttons = new FormatButtonGroup();
// 或: Format.createButtonGroup();

buttons.addRow().addButton('确认', { action: 'confirm' }).addButton('取消', { action: 'cancel' }).addRow().addButton('帮助', { action: 'help' });

// 使用
format.addButtonGroup(buttons);

// 合并
buttons.absorb(otherButtons);

// 清空
buttons.clear();
```

## FormatMarkDown

结构化 Markdown 构建器。

```typescript
import { FormatMarkDown } from 'alemonjs';

const md = new FormatMarkDown();
// 或: Format.createMarkdown();

md.addTitle('标题') // # 标题
  .addSubtitle('副标题') // ## 副标题
  .addText('正文')
  .addBold('加粗')
  .addItalic('斜体')
  .addStrikethrough('删除线')
  .addLink('https://example.com', '链接')
  .addImage('url', '图片描述')
  .addCode('console.log(1)')
  .addList(['项目1', '项目2'])
  .addBlockquote('引用')
  .addDivider() // ---
  .addNewline()
  .addBreak()
  .addMention(userId)
  .addButton('操作', data)
  .addContent('原始内容');

// 使用
format.addMarkdown(md);

// 合并
md.absorb(otherMd);

// 清空
md.clear();
```

## 底层数据类型（DataEnums）

Format 内部使用的数据联合类型：

| 类型              | 说明     | 工厂函数             |
| ----------------- | -------- | -------------------- |
| `DataText`        | 纯文本   | `Text(string)`       |
| `DataImage`       | 图片     | `Image(buffer\|url)` |
| `DataButton`      | 单个按钮 | `BT(title, data)`    |
| `DataButtonGroup` | 按钮组   | `BT.group(...rows)`  |
| `DataMarkDown`    | Markdown | `MD(...items)`       |
| `DataMention`     | @提及    | `Mention(userId)`    |
| `DataLink`        | 超链接   | `Link(url, text)`    |
| `DataAttachment`  | 附件     | `Attachment(buffer)` |
| `DataAudio`       | 音频     | `Audio(buffer)`      |
| `DataVideo`       | 视频     | `Video(buffer)`      |

## 发送消息

```typescript
const [message] = useMessage(event);

// 推荐方式
message.send({
  format: Format.create().addText('Hello'),
  replyId: event.MessageId // 默认自动回复触发消息
});

// 底层方式
message.send([Text('Hello'), Image(buffer)]);
```

## 图片渲染（jsxp）

将 React 组件渲染为图片 Buffer：

```typescript
import { renderComponentToBuffer } from 'jsxp';

const buffer = await renderComponentToBuffer(
  '/route', // 路由标识
  ComponentFunction, // React 组件
  { props } // Props
);

// buffer: Buffer | boolean (失败时为 false)
```

组件模板：

```tsx
import React from 'react';
import { LinkStyleSheet, BackgroundImage } from 'jsxp';
import css from '@src/assets/main.css';

export default function Card({ title }: { title: string }) {
  return (
    <html>
      <head>
        <LinkStyleSheet src={css} />
      </head>
      <body>
        <div className='p-4'>{title}</div>
      </body>
    </html>
  );
}
```

样式使用 Tailwind CSS，通过 `@src/assets/main.css` 引入。
