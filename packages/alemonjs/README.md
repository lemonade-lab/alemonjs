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
