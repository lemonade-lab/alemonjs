# AlemonJS 路由参考

## defineRouter

声明式路由系统，支持正则匹配、前缀匹配、精确匹配和嵌套子路由。

```typescript
import { defineRouter, lazy } from 'alemonjs';

const router = defineRouter([
  {
    // 匹配条件（可组合，按优先级依次检查）
    exact?: string,        // 精确匹配，O(1)，最快
    prefix?: string,       // 前缀匹配，O(n)
    regular?: RegExp,      // 正则匹配，自动缓存编译结果

    // 事件类型过滤
    selects?: EventKeys | EventKeys[],

    // 处理器（必须使用 lazy 懒加载）
    handler: lazy(() => import('./response/xxx')),

    // 嵌套子路由（可选）
    children?: ResponseRoute[]
  }
]);
```

## lazy 懒加载

`lazy` 函数将 `import()` 包装为惰性加载，首次匹配时才加载模块，后续复用缓存：

```typescript
import { lazy } from 'alemonjs';

// ✅ 正确：使用 lazy 包装动态 import
handler: lazy(() => import('./response/hello'));

// ❌ 错误：直接使用 import（立即加载全部模块）
handler: () => import('./response/hello');
```

`lazy` 要求目标模块必须有 `export default`。

## 匹配优先级

对于同一个路由节点内的匹配条件，检查顺序为：

```
1. exact  (字符串相等比较)  → 不匹配则跳过
2. prefix (startsWith)     → 不匹配则跳过
3. regular (正则 test)     → 不匹配则跳过
```

路由节点本身按数组顺序遍历，**先匹配先执行**。

## 嵌套路由

子路由会继承父路由的中间件链：

```typescript
defineRouter([
  {
    prefix: '/admin',
    selects: ['message.create'],
    handler: lazy(() => import('./middleware/admin-auth')),
    children: [
      {
        exact: '/admin ban',
        handler: lazy(() => import('./response/admin-ban'))
      },
      {
        exact: '/admin kick',
        handler: lazy(() => import('./response/admin-kick'))
      }
    ]
  }
]);
```

执行流程：

1. 匹配 `/admin` 前缀 → 执行 `admin-auth` handler
2. `admin-auth` return true → 进入 children
3. 匹配 children 中的 exact → 执行对应 handler

## 路由与中间件分离

`register()` 可以同时返回 `responseRouter` 和 `middlewareRouter`：

```typescript
export default defineChildren({
  register() {
    return {
      responseRouter: defineRouter([
        /* 响应路由 */
      ]),
      middlewareRouter: defineRouter([
        /* 中间件路由 */
      ])
    };
  }
});
```

**执行顺序**：middlewareRouter → responseRouter

## ResponseRoute 完整类型

```typescript
type ResponseRoute = {
  regular?: RegExp; // 正则匹配
  prefix?: string; // 前缀匹配
  exact?: string; // 精确匹配
  selects?: EventKeys | EventKeys[]; // 事件类型
  handler: () => Promise<any>; // 处理器（通过 lazy 包装）
  children?: ResponseRoute[]; // 子路由
};
```

## handler 文件约定

每个 handler 文件必须 `export default` 一个函数：

```typescript
// 签名
export default async (event: Events[T], next: Next) => {
  // return true   → 继续链
  // return void   → 停止链
  // next()        → 跳过当前节点，进入下个兄弟路由
};
```

- `event`：标准化的事件对象
- `next`：跳过函数（NOT 中间件 next，而是路由级别的跳过）
