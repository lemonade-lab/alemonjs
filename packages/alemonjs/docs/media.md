# 图片来源、平台资源与 Markdown 素材

日常开发只需描述图片来源，再把它放进普通消息或 Markdown。构造素材和消息时不上传；`useMessage().send()` 根据节点位置准备资源，随后发送。

## 最常用的写法

```ts
import { Media, Format, useMessage, useMedia, ResultCode } from 'alemonjs';

const image = Media.image({ filePath: '/absolute/path/chart.png' });
const markdown = Format.createMarkdown().addText('今日统计').addImage(image, { width: 800, height: 400 });

const results = await useMessage(event)[0].send(Format.create().addMarkdown(markdown).value);
```

同一来源放进普通消息，即走普通图片链路：

```ts
await useMessage(event)[0].send(Format.create().addImage(image).value);
```

`image` 是可重复使用的来源描述。发送不会把它原地改成某个平台的资源，因此可以用于其他机器人或不同消息位置。资源准备属于发送过程，构造器仍然同步且没有网络副作用。

## 三种来源

```ts
Media.image({ filePath: '/absolute/path/chart.png' });
Media.image({ url: 'https://example.com/chart.png' });
Media.image({ data: base64Text, name: 'chart.png' });
```

三者必须且只能提供一个。URL 来源使用 HTTP/HTTPS。文件路径必须在适配器进程所在机器可读。也可使用 `useMedia(event)[0].create(source)` 创建同样的图片描述。

当前结构化来源和资源模型首先覆盖图片；音频、视频、文件仍使用原有消息节点及媒体 Hook，没有宣称这些类型已获得新的资源管理能力。

## 来源与已上传资源

| 对象               | 含义                                                    | 能否跨平台或机器人复用                   |
| ------------------ | ------------------------------------------------------- | ---------------------------------------- |
| `Media.image(...)` | URL、路径或 Base64 来源描述                             | 可以重新处理，前提是来源仍可访问         |
| `MediaResource`    | 已上传资源，包含 owner、usage、reference 和可选目标范围 | 必须匹配归属和用途；不自动跨平台重新上传 |

普通图片位置使用 `usage: 'message'`；Markdown 中使用 `usage: 'markdown'`。QQ 两者是不同协议，普通资源不能直接塞进 Markdown，反之亦然。需要两种用途时，复用原始来源分别准备。

发送前会检查整条结构化消息中的资源归属和用途，包括嵌套引用块。已知资源属于另一个平台、机器人或会话时，准备阶段即失败，不先上传其他图片再发现冲突。

## 显式提前上传与素材管理

兼容已有 API：不传 `usage` 的 `useMedia().upload()` 仍走旧 `media.upload` Action，返回原有 `MediaReceipt/fileId`。

需要新资源对象时，明确指定用途：

```ts
const [media] = useMedia({ Platform: 'qq-bot', BotId: 'APP_ID' });
const uploaded = await media.upload({
  type: 'image',
  filePath: '/absolute/path/chart.png',
  usage: 'markdown'
});
if (uploaded.code === ResultCode.Ok) {
  const markdown = Format.createMarkdown().addImage(uploaded.data);
  // 在同一机器人的消息上下文发送 markdown。
}

const page = await media.list({ usage: 'markdown', cursor: undefined });
const capabilities = await media.capabilities();
// capabilities.data.usages.markdown?.list / delete / maxBytes / maxItems
// await media.delete(uploaded.data); // 仅在确认不再复用时删除
```

QQ Markdown 素材属于机器人，提前上传、查询、删除不要求群或用户目标。QQ 普通图片资源则需要明确目标，且记录目标范围。`upload({ usage: ... })` 只准备资源，不接受 send、replyId 等消息投递参数；投递由 `message.send` 完成。

## 平台支持与扩展

通用核心不识别 QQ 私有协议。它根据图片位置发送 `media.resource.resolve`，适配器返回标准资源引用；普通图片来源可直接转换为现有图片字符串来源，沿用已接入平台的发送逻辑。

当前 QQ 适配器完整实现图片资源的 message/markdown 两种用途，以及 Markdown 素材查询和删除。其他适配器尚未接入新的 Markdown 素材 Action 时，会返回准备失败，不自动把嵌入图片降级成占位文字或拆成另一条消息。

旧的 `addImage(string)`、`addImage(Buffer)` 和 Markdown 图片 URL 字符串保持原有行为。原始 Markdown 字符串不会被框架扫描并偷偷上传；管理资源应通过结构化图片节点传入。

扩展适配器时按以下语义接入，直接使用框架标准字段：

| Action                        | 作用                                              |
| ----------------------------- | ------------------------------------------------- |
| `media.resource.resolve`      | 根据 image 来源/资源及 usage 准备适合该位置的引用 |
| `media.resource.upload`       | 显式提前上传，返回资源对象                        |
| `media.resource.list`         | 按用途分页查询平台托管资源                        |
| `media.resource.delete`       | 校验归属后删除平台资源                            |
| `media.resource.capabilities` | 按用途报告上传、查询、删除及平台限制              |

资源必须返回实际 platform/BotId；不支持的用途或操作明确失败。不要用普通附件 ID 冒充 Markdown 图片 URL，也不要把临时预览地址当作持久引用。新增能力需在适配器中实际实现后再报告支持。

## QQ 素材细节

依据[官方素材管理文档](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html)，QQ Markdown 素材上传是 prepare → 预签名 URL PUT → complete，最终引用为 `qqbot-media://image/v1/...`。

适配器读取有界图片字节，识别 PNG/JPEG/GIF/WebP 文件签名，校验文件名扩展名与识别到的 MIME 一致；提交 MD5/SHA1，并核对 PUT 返回的 ETag 后完成上传。文件签名识别不等于完整图片解码，平台发送时仍可能拒绝损坏文件。COS 直传不携带机器人鉴权或 Cookie，短期预览链接不进入持久资源对象。

每个机器人内部合并同内容、文件名和 MIME 的并发上传；本地复用缓存最多 100 条，不自动删除远程素材。删除成功后移除该素材的本地复用记录。平台配额满时保留平台错误，不自动删除可能仍被其他业务引用的图片。

资源标记 `expiration.mode: 'sliding'`，不会伪造固定过期时间。本地缓存只在已知有效窗口内保守复用；服务端查询返回的 expires_at 才作为当前过期快照。外部删除、权限变化等仍可能使发送失败，缓存命中不代表在线有效性保证。

## 上传成功、发送失败

新模型的发送结果在有资源准备时增加可选字段：

```ts
result.media?.stage; // prepare 或 send
result.media?.resources; // 已经完成准备、可供后续复用的资源
result.media?.failure; // 准备/请求异常的原始失败信息（有时存在）
```

准备失败时不发送半条消息；此前成功的资源仍随结果返回。发送失败时也保留资源，重试可以直接使用它们，或由 QQ 缓存复用原始来源；框架不会自动重发消息，以免重复投递。没有新资源的旧发送结果保持原有结构。

## 验证

```sh
yarn test:media
yarn test:markdown
yarn workspace @alemonjs/qq-bot test:non-channel
yarn workspace @alemonjs/qq-bot test:channel
```

新增测试覆盖公开类型、纯构造、嵌套解析、归属与用途校验、旧字符串引用块、失败阶段与资源保留；QQ 测试使用真实本地 HTTP 验证 API/二进制请求、哈希与 MIME/ETag、鉴权隔离、配额失败、并发复用及删除。不使用真实 QQ 凭证，尚未完成官方在线验收。
