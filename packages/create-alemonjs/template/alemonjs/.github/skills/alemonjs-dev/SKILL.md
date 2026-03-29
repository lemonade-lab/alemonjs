---
name: alemonjs-dev
description: 'AlemonJS 跨平台聊天机器人开发技能。Use when: 开发 AlemonJS 应用、创建消息响应、编写中间件、使用 hooks（useMessage/useMention/useSubscribe）、构建路由、处理事件、发送消息（Format）、图片渲染（jsxp）、创建平台适配器、配置 defineChildren 生命周期。适用于 bot 开发、插件开发、跨平台适配。'
argument-hint: '描述你要开发的功能，如 "创建一个 /sign 签到指令" 或 "添加图片回复"'
---

# AlemonJS 跨平台聊天机器人开发

## 适用场景

- 创建新的消息响应指令（如 /hello、/help、/签到）
- 编写中间件（权限校验、日志、限流等）
- 使用 hooks 处理消息、提及、订阅
- 构建路由树（嵌套路由、懒加载）
- 发送富文本消息（文本、图片、按钮、Markdown）
- 使用 jsxp 渲染图片
- 创建或适配新平台
- 配置应用生命周期

## 核心概念速查

| 概念             | 说明                                      | 详见                                       |
| ---------------- | ----------------------------------------- | ------------------------------------------ |
| `defineChildren` | 定义子模块入口（生命周期 + 注册路由）     | [架构参考](./references/architecture.md)   |
| `defineRouter`   | 声明式路由（正则/前缀/精确匹配 + 懒加载） | [路由参考](./references/routing.md)        |
| `useMessage`     | Hook：发送消息                            | [Hooks 参考](./references/hooks.md)        |
| `useMention`     | Hook：获取 @提及用户                      | [Hooks 参考](./references/hooks.md)        |
| `useSubscribe`   | Hook：事件订阅（跨生命周期监听）          | [Hooks 参考](./references/hooks.md)        |
| `Format`         | 消息格式构建器（链式 API）                | [消息参考](./references/message-format.md) |
| `createEvent`    | 创建事件上下文（用于 handler 内二次过滤） | [事件参考](./references/events.md)         |

## 开发流程

### 1. 创建新指令（最常见场景）

**步骤**：

1. 在 `src/response/` 下新建处理器文件，`export default` 一个异步函数
2. 在 `src/index.ts` 的 `defineRouter` 中注册路由
3. 使用 `lazy(() => import('./response/xxx'))` 懒加载

**模板 — 简单文本回复**：

```typescript
// src/response/ping.ts
import { useMessage, createEvent, Format } from 'alemonjs';

export default async (e, next) => {
  const event = createEvent({
    event: e,
    selects: ['message.create', 'private.message.create']
  });
  if (!event.selects) {
    next();
    return;
  }

  const [message] = useMessage(event);
  const format = Format.create();
  format.addText('pong!');
  message.send({ format });
};
```

**模板 — 带参数解析**：

```typescript
// src/response/echo.ts
import { useMessage, createEvent, Format } from 'alemonjs';

export default async (e, next) => {
  const event = createEvent({
    event: e,
    selects: ['message.create'],
    prefix: '/echo '
  });
  if (!event.selects || !event.prefix) {
    next();
    return;
  }

  const text = event.MessageText.replace(/^\/echo\s*/, '');
  const [message] = useMessage(event);
  const format = Format.create();
  format.addText(text || '请输入内容');
  message.send({ format });
};
```

**模板 — 带 @用户**：

```typescript
// src/response/greet.ts
import { useMessage, useMention, createEvent, Format } from 'alemonjs';

export default async (e, next) => {
  const event = createEvent({
    event: e,
    selects: ['message.create']
  });
  if (!event.selects) {
    next();
    return;
  }

  const [message] = useMessage(event);
  const [mention] = useMention(event);

  const userRes = await mention.findOne();
  if (!userRes.count || !userRes.data) {
    const format = Format.create();
    format.addText('请 @一个用户');
    message.send({ format });
    return;
  }

  const format = Format.create();
  format.addText(`你好, ${userRes.data.UserName || userRes.data.UserId}!`);
  message.send({ format });
};
```

### 2. 注册路由

在 `src/index.ts` 修改 `defineRouter` 数组：

```typescript
import { defineChildren, defineRouter, lazy, logger } from 'alemonjs';

const responseRouter = defineRouter([
  {
    // 匹配方式三选一或组合使用
    exact: '/ping', // 精确匹配（最快，O(1)）
    // prefix: '/echo',               // 前缀匹配（O(n)）
    // regular: /^\/help/,            // 正则匹配（缓存编译）
    selects: ['message.create', 'private.message.create'],
    handler: lazy(() => import('./response/ping'))
  },
  {
    regular: /hello/,
    selects: ['message.create'],
    handler: lazy(() => import('./response/greet')),
    // 嵌套子路由
    children: [
      {
        exact: '/hello world',
        handler: lazy(() => import('./response/hello-world'))
      }
    ]
  }
]);

export default defineChildren({
  register() {
    return { responseRouter };
  },
  onCreated() {
    logger.info('应用启动完成');
  }
});
```

### 3. 发送富文本消息

```typescript
import { Format, FormatButtonGroup, FormatMarkDown } from 'alemonjs';

// 纯文本
const f1 = Format.create();
f1.addText('Hello World');

// 图片（Buffer | URL | base64://）
const f2 = Format.create();
f2.addImage(buffer); // Buffer
f2.addImage('https://example.com/img.png'); // URL
f2.addImage('base64://...'); // Base64

// 按钮组
const buttons = new FormatButtonGroup();
buttons.addRow().addButton('确认', { action: 'confirm' }).addButton('取消', { action: 'cancel' });
const f3 = Format.create();
f3.addText('请选择：');
f3.addButtonGroup(buttons);

// Markdown
const md = new FormatMarkDown();
md.addTitle('标题').addText('正文内容').addBold('加粗').addLink('https://alemonjs.com', 'AlemonJS');
const f4 = Format.create();
f4.addMarkdown(md);

// 组合消息（链式调用）
const f5 = Format.create();
f5.addText('标题').addImage(buffer).addText('描述文字');
```

### 4. 图片渲染（jsxp）

```typescript
// src/response/card.ts
import { renderComponentToBuffer } from 'jsxp';
import { useMessage, createEvent, Format } from 'alemonjs';
import CardComponent from '@src/image/component/Card';

export default async (e, next) => {
  const event = createEvent({ event: e, selects: ['message.create'] });
  if (!event.selects) {
    next();
    return;
  }

  const [message] = useMessage(event);
  const img = await renderComponentToBuffer('/card', CardComponent, {
    title: 'Hello',
    data: event.MessageText
  });

  const format = Format.create();
  if (typeof img !== 'boolean') {
    format.addImage(img);
  } else {
    format.addText('图片渲染失败');
  }
  message.send({ format });
};
```

```tsx
// src/image/component/Card.tsx
import React from 'react';
import { LinkStyleSheet } from 'jsxp';
import css from '@src/assets/main.css';

export default function Card({ title, data }: { title: string; data: string }) {
  return (
    <html>
      <head>
        <LinkStyleSheet src={css} />
      </head>
      <body>
        <div className='p-4 bg-white rounded-lg shadow'>
          <h1 className='text-2xl font-bold text-blue-500'>{title}</h1>
          <p className='mt-2 text-gray-700'>{data}</p>
        </div>
      </body>
    </html>
  );
}
```

### 5. 编写中间件

```typescript
// src/index.ts
import { defineChildren, defineRouter, defineMiddleware, lazy } from 'alemonjs';

const middlewareRouter = defineRouter([
  {
    prefix: '/',
    selects: ['message.create'],
    handler: lazy(() => import('./middleware/auth'))
  }
]);

const responseRouter = defineRouter([
  /* ... */
]);

export default defineChildren({
  register() {
    return { responseRouter, middlewareRouter };
  }
});
```

```typescript
// src/middleware/auth.ts
export default async (e, next) => {
  // return true  → 继续执行下一个 handler
  // return void/false → 终止链
  if (e.IsMaster) {
    return true; // 放行
  }
  // 鉴权失败，不调用 next，链终止
};
```

### 6. 使用订阅（useSubscribe）

```typescript
// src/response/confirm.ts
import { useMessage, useSubscribe, createEvent, Format } from 'alemonjs';

export default async (e, next) => {
  const event = createEvent({ event: e, selects: ['message.create'] });
  if (!event.selects) {
    next();
    return;
  }

  const [message] = useMessage(event);
  const [subscribe] = useSubscribe(event, ['message.create']);

  // 发送确认提示
  const format = Format.create();
  format.addText('确认操作？回复 "是" 或 "否"');
  message.send({ format });

  // 注册订阅：等待同一用户在 create 阶段的下条消息
  const reg = subscribe.create(
    async (ev, next) => {
      if (ev.MessageText === '是') {
        const [msg] = useMessage(ev);
        msg.send({ format: Format.create().addText('已确认！') });
      } else {
        const [msg] = useMessage(ev);
        msg.send({ format: Format.create().addText('已取消。') });
      }
      // 处理完毕后取消订阅
      subscribe.cancel(reg);
    },
    ['UserId', 'MessageText'] // 监听的 event key
  );
};
```

### 7. 主动消息（MessageDirect）

```typescript
import { MessageDirect, Format } from 'alemonjs';

const direct = MessageDirect.create();

// 向频道发送
await direct.sendToChannel({
  SpaceId: 'channel_id_123',
  format: Format.create().addText('定时通知')
});

// 向用户私信
await direct.sendToUser({
  OpenID: 'user_id_456',
  format: Format.create().addText('私信通知')
});
```

## 关键规则

### Handler 返回值约定

```
return true   → 继续执行链中的下一个 handler
return void   → 停止当前链（默认行为）
return false  → 停止当前链
```

### next() 的含义

- 在路由 handler 中：`next()` 表示当前 handler 不处理，跳到下一个路由节点
- 在中间件中：`return true` 放行到下一个中间件或响应处理器

### 事件过滤模式

始终在 handler 开头用 `createEvent` + `if (!event.selects)` 过滤事件类型：

```typescript
export default async (e, next) => {
  const event = createEvent({
    event: e,
    selects: ['message.create'] // 只处理公域消息
  });
  if (!event.selects) {
    next(); // 不是目标事件类型，放过
    return;
  }
  // 处理逻辑...
};
```

### 路由匹配优先级

```
exact (精确) > prefix (前缀) > regular (正则)
```

性能排序：exact O(1) → prefix O(n) → regular（缓存编译后匹配）

### defineChildren 生命周期

```
defineChildren({
  register()    → 注册路由/中间件（返回 { responseRouter, middlewareRouter }）
  onCreated()   → 注册完成后触发（初始化资源）
  onMounted()   → 挂载完成后触发（接收 store 参数）
  unMounted(e)  → 卸载时触发（清理资源，e 为错误对象）
})
```

## 项目结构约定

```
src/
├── index.ts              # 入口：defineChildren + defineRouter
├── env.d.ts              # 类型声明（/// <reference types="alemonjs/env" />）
├── response/             # 响应处理器（每个文件 export default 一个函数）
│   ├── hello.ts
│   ├── help.ts
│   └── sign.ts
├── middleware/            # 中间件处理器
│   └── auth.ts
├── image/                # jsxp 图片组件
│   └── component/
│       ├── Html.tsx       # HTML 外壳组件
│       └── Card.tsx
└── assets/               # 静态资源（CSS、图片）
    ├── main.css
    └── root.css
```

## 可用事件类型（EventKeys）

| 事件                                      | 说明                   |
| ----------------------------------------- | ---------------------- |
| `message.create`                          | 公域消息创建           |
| `private.message.create`                  | 私域消息创建           |
| `interaction.create`                      | 公域交互（按钮点击等） |
| `private.interaction.create`              | 私域交互               |
| `message.update`                          | 消息更新               |
| `message.delete`                          | 消息删除               |
| `message.reaction.add`                    | 表情回应添加           |
| `message.reaction.remove`                 | 表情回应移除           |
| `message.pin`                             | 消息置顶               |
| `channel.create/delete/update`            | 频道增删改             |
| `guild.join/exit/update`                  | 服务器加入/退出/更新   |
| `member.add/remove/ban/unban/update`      | 成员变动               |
| `notice.create` / `private.notice.create` | 通知                   |
| `private.friend.add/remove`               | 好友变动               |
| `private.guild.add`                       | 入群请求               |

## 开发命令

```bash
npm run dev          # 开发模式（热重载）
npm run build        # 构建生产版本
npm run view         # 预览 jsxp 图片组件
npm run review       # 审核 UI（alemonc）
```

## 常见错误排查

| 错误                           | 原因                              | 解决                                        |
| ------------------------------ | --------------------------------- | ------------------------------------------- |
| `module has no default export` | handler 文件没有 `export default` | 确保 `export default async (e, next) => {}` |
| 消息不触发                     | `selects` 未匹配事件类型          | 检查 `createEvent` 中的 `selects` 数组      |
| 路由不匹配                     | 正则/前缀/精确匹配失败            | 检查 `defineRouter` 中的匹配条件            |
| `next()` 后依然执行            | `next()` 后未 `return`            | 在 `next()` 之后加 `return`                 |
| 图片渲染返回 boolean           | jsxp 组件出错                     | 检查组件引用路径和 CSS 导入                 |
