# 消息类型与格式

[返回 README](./README.md) · [框架开发指南](./FRAMEWORK.md)

## QQ-Bot 消息类型

QQ-Bot 平台支持的消息类型与 `Format` / `DataEnums` 的对应关系，以及平台特有的构造写法。

### Format → QQ-Bot 类型映射

| Format 构建器                               | DataEnums 类型                          | QQ-Bot 落地                       | 说明                                                 |
| ------------------------------------------- | --------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| `Format.create().addText(text)`             | `Text`                                  | 纯文本 `msg_type: 0`              | 最常用                                               |
| `addMention(userId)`                        | `Mention`                               | `<@user_id>` / `<@everyone>`      | 群聊/单聊有效，频道无 @ 语法                         |
| `Format.createMarkdown().addLink()` 等      | `Markdown`                              | Markdown 消息 `msg_type: 2`       | 需要平台 MD 权限，否则可降级                         |
| `addMarkdownOriginal('**raw**')`            | `MarkdownOriginal`                      | Markdown 原始字符串 `msg_type: 2` | 平台侧直接渲染 raw 文本                              |
| `addImage(url)` / `addImage(buffer)`        | `Image` / `ImageFile` / `ImageURL`      | 富媒体图片 `msg_type: 7`          | 群/单聊先上传富媒体（file_type 1）；频道走 multipart |
| `addAudio(url)`                             | `Audio`                                 | 富媒体语音 `msg_type: 7`          | 群/单聊支持（file_type 3）；频道不支持降级           |
| `addVideo(url)`                             | `Video`                                 | 富媒体视频 `msg_type: 7`          | 群/单聊支持（file_type 2）；频道降级                 |
| `addAttachment(url, options?)`              | `Attachment`                            | 富媒体文件 `msg_type: 7`          | 群/单聊支持（file_type 4）；上传失败时降级           |
| `Format.createButtonGroup().addButton(...)` | `BT.group`                              | 按钮（keyboard）`msg_type: 2`     | 群/单聊最多 5 行 × 每行 5 个                         |
| -（直接传 `DataEnums`）                     | `ButtonTemplate`                        | 平台按钮模板 `keyboard.id`        | value 为平台侧模板 ID                                |
| -（直接传 `DataEnums`）                     | `Ark.list` / `Ark.Card` / `Ark.BigCard` | Ark 卡片 `msg_type: 3`            | QQ-Bot 特有，`Format` 无内置构建器                   |

### 文本与 @

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  await message.send({
    format: Format.create().addText('欢迎 ').addMention('USER_OPENID').addText(' 加入！')
  });
};
```

### Markdown（需平台权限）

使用 `Format.createMarkdown()` 链式构建：

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  const md = Format.createMarkdown()
    .addTitle('今日推荐')
    .addSubtitle('副标题')
    .addText('正文内容')
    .addBold('加粗')
    .addItalic('斜体')
    .addLink('显示文本', 'https://example.com')
    .addImage('https://img.url', { width: 200, height: 100 })
    .addCode('console.log(1)', { language: 'ts' })
    .addList('选项一', '选项二')
    .addBlockquote('引用')
    .addDivider();

  await message.send({ format: Format.create().addMarkdown(md) });
};
```

> 未开通 MD 权限时发送会失败，可在配置中开启 `markdownToText: true` 强制降级为纯文本。

### 按钮（BT.group）

使用 `Format.createButtonGroup()`，平台限制：最多 **5 行**，每行最多 **5 个**按钮，超出自动裁剪。

#### 数据结构

每个按钮最终发送到 QQ 平台的结构如下（适配器自动生成，`rawData` 可透传覆盖任意字段）：

```jsonc
{
  "keyboard": {
    "content": {
      // 小按钮样式（可选）：整个键盘使用小号按钮
      "style": { "font_size": "small" },
      "rows": [
        {
          "buttons": [
            {
              "id": "1",
              "render_data": {
                "label": "按钮文字",
                "visited_label": "点击后文字",
                "style": 0 // 0 灰色线框 / 1 蓝色线框 / 3 红框 / 4 蓝底白字
              },
              "action": {
                "type": 2, // 0 跳转链接 / 1 回调 / 2 指令
                "permission": { "type": 2, "specify_user_ids": [], "specify_role_ids": [] },
                "data": "指令或链接",
                "enter": false, // 指令按钮点击后自动发送
                "reply": false, // 指令按钮带引用回复
                "anchor": 0, // 1 唤起选图器（仅单聊）
                "click_limit": undefined, // 可操作点击次数限制
                "at_bot_show_channel_list": false, // 弹出子频道选择器
                "unsupport_tips": "当前客户端不支持此操作",
                // 点击确认弹窗（可选）
                "modal": { "content": "是否确认操作?", "confirm_text": "是", "cancel_text": "否" }
              }
            }
          ]
        }
      ]
    }
  }
}
```

#### 基本用法

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  const bt = Format.createButtonGroup()
    .addRow()
    .addButton('指令按钮', '/command', { type: 'command' })
    .addButton('跳转链接', 'https://example.com', { type: 'link' })
    .addRow()
    .addButton('自动回车', '/auto', { type: 'command', autoEnter: true });

  await message.send({ format: Format.create().addText('请选择').addButtonGroup(bt) });
};
```

#### 按钮样式（4 种）

`render_data.style` 对应关系，通过 `options.style` 设置（样式名或数字均可）：

| 样式名        | 样式编号 | 说明             |
| ------------- | -------- | ---------------- |
| `'gray'`      | `0`      | 灰色线框（默认） |
| `'blue'`      | `1`      | 蓝色线框         |
| `'red'`       | `3`      | 红框             |
| `'blue-fill'` | `4`      | 蓝底白字         |

```ts
await message.send({
  format: Format.create().addButtonGroup(
    Format.createButtonGroup()
      .addRow()
      .addButton('灰框', '/a', { style: 'gray' })
      .addButton('蓝框', '/b', { style: 'blue' })
      .addButton('红框', '/c', { style: 'red' })
      .addButton('蓝底白字', '/d', { style: 'blue-fill' })
  )
});
```

#### 小按钮样式

小按钮是**整个按钮消息的全局配置**（`keyboard.content.style = { font_size: 'small' }`），在按钮组上调用一次 `.smallButton()` 即可让整组按钮全部变小，按钮本身仍按普通按钮书写，无需逐按钮设置：

```ts
// 只需在按钮组上设置一次 .smallButton()
const bt = Format.createButtonGroup()
  .smallButton() // 全局小按钮样式
  .addRow()
  .addButton('选项一', '/opt1')
  .addButton('选项二', '/opt2');

await message.send({ format: Format.create().addText('小按钮键盘').addButtonGroup(bt) });
```

> 等效的原始协议写法：`keyboard.content.style = { font_size: 'small' }`（放在 `keyboard.content` 层级，对整个键盘生效）。

#### 点击确认弹窗

按钮点击后弹出确认框（`action.modal`），确认后才继续执行：

```ts
await message.send({
  format: Format.create().addButtonGroup(
    Format.createButtonGroup()
      .addRow()
      .addButton('领取奖励', '/reward', {
        type: 'command',
        modal: { content: '确定要领取奖励吗？', confirmText: '领取', cancelText: '取消' }
      })
  )
});
```

#### options 说明

| 选项                   | 类型                                             | 说明                                                                  |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `type`                 | `'command'` \| `'link'` \| `'call'`              | 指令按钮（默认，点击在输入框插入指令）/ 跳转链接 / 回调按钮           |
| `data`                 | string                                           | 按钮携带的数据（`type=command` 为指令文本，`type=link` 为跳转 URL）   |
| `autoEnter`            | boolean                                          | 指令按钮点击后自动发送                                                |
| `style`                | `'gray'` \| `'blue'` \| `'red'` \| `'blue-fill'` | 按钮样式（见上表）                                                    |
| `modal`                | `{ content?, confirmText?, cancelText? }`        | 点击确认弹窗，确认后继续执行                                          |
| `permission`           | `{ type?, userIds?, roleIds? }`                  | 操作权限：`type` 0 指定用户 / 1 仅管理 / 2 全部（默认）/ 3 指定身份组 |
| `toolTip`              | string                                           | 无权限点击时的提示                                                    |
| `reply`                | boolean                                          | 指令按钮带引用回复本消息                                              |
| `anchor`               | number                                           | `1` 点击后唤起选图器（仅单聊场景客户端支持）                          |
| `clickLimit`           | number                                           | 可操作点击次数限制（默认不限）                                        |
| `atBotShowChannelList` | boolean                                          | 指令按钮点击后弹出子频道选择器                                        |
| `rawData`              | object                                           | 透传的原始按钮数据（可覆盖 `render_data` / `action` 任意字段）        |

> 兼容旧写法：`data` 传对象 `{ click, confirm, cancel }` 也会转换为确认弹窗（`content=click`、`confirm_text=confirm`、`cancel_text=cancel`）。

点击按钮后触发 `INTERACTION_CREATE` 事件（`interaction.create`），`data.resolved.button_data` 即按钮的 `data`，适配器已自动回应（解除 loading）。

### Ark 卡片（QQ-Bot 特有）

`Format` 没有内置 Ark 构建器，直接以 `DataEnums` 传入：

```ts
import { useMessage } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  await message.send({
    format: [
      {
        type: 'Ark.Card',
        value: {
          title: '标题',
          cover: 'https://example.com/cover.png',
          link: 'https://example.com',
          subtitle: '副标题',
          decs: '描述',
          prompt: '提示语',
          metadecs: '元描述'
        }
      }
    ]
  });
};
```

| 类型          | 对应模板 | 说明                            |
| ------------- | -------- | ------------------------------- |
| `Ark.list`    | 模板 23  | 列表（`[tip, content]`）        |
| `Ark.Card`    | 模板 24  | 图文卡片（标题/封面/链接/描述） |
| `Ark.BigCard` | 模板 37  | 大卡片                          |

> 模板详情参考官方文档 `server-inter/message/type/template/template_23.md`、`template_24.md`、`template_37.md`。

### 富媒体（图片 / 视频 / 音频 / 文件）

群聊与单聊支持图片、视频、语音、文件富媒体消息（`msg_type: 7`，先上传获取 `file_info`）。适配器按类型自动选择 `file_type` 并上传：

| 类型                                    | `file_type` | 格式     | 软限制 | 群聊 | 单聊 | 频道            |
| --------------------------------------- | ----------- | -------- | ------ | ---- | ---- | --------------- |
| 图片 `Image` / `ImageFile` / `ImageURL` | 1           | png、jpg | 20 MB  | ✅   | ✅   | ✅（multipart） |
| 视频 `Video`                            | 2           | mp4      | 30 MB  | ✅   | ✅   | ❌ 降级         |
| 语音 `Audio`                            | 3           | silk     | 20 MB  | ✅   | ✅   | ❌ 降级         |
| 文件 `Attachment`                       | 4           | 不限     | 200 MB | ✅   | ✅   | ❌ 降级         |

```ts
import { useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();

  // 图片（URL / Buffer）
  await message.send({ format: Format.create().addImage('https://example.com/a.png') });
  // 视频（URL / file:// / base64:// / Buffer）
  await message.send({ format: Format.create().addVideo('https://example.com/a.mp4') });
  // 语音（silk 格式）
  await message.send({ format: Format.create().addAudio('https://example.com/a.silk') });
  // 文件
  await message.send({ format: Format.create().addAttachment('https://example.com/a.zip', { filename: 'a.zip' }) });
};
```

> 说明：
>
> - 富媒体消息（`msg_type: 7`）无法携带原生 Markdown/按钮，适配器会将 MD/按钮降级为文本合入 `content`，并移除已作为富媒体发送的占位符
> - 值支持 `https://` / `http://`（自动拉取转 base64）、`file://` 本地路径、`base64://`、Buffer
> - 超过软限制时降级为文件类型，超过 200 MB 硬限制返回错误
> - 大于 10MB 的文件自动走分片上传流程
> - 频道（Guild）接口仅支持图片（`file_image`），视频/音频/文件在频道场景降级为 `[视频]` / `[音频]` / `[附件]` 占位文本

### 降级策略

`markdownToText` 与 `hideUnsupported` 两个配置项控制不支持类型的降级行为（见 [配置](./README.md#配置)）：

- `markdownToText: true`：Markdown 与按钮全部转为纯文本发送，适合没有 MD 权限的机器人
- `hideUnsupported: 1~4`：按级别隐藏不支持的占位符（`[视频]`、`[音频]` 等），转换后内容为空则跳过发送
