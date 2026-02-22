# [ALemonJS](https://alemonjs.com)

专用于开发聊天机器人的 Node.js 框架，它提供了完整的事件驱动架构来处理各种聊天平台的消息和交互。

官网文档 https://alemonjs.com

## 🏗️ 架构设计特点

1. 事件驱动架构

基于事件选择器和响应处理器的模式

支持多种事件类型（如消息创建、消息撤回等）

事件处理包含完整的生命周期：创建、挂载、卸载

2. CBP 通信协议

支持客户端-服务器架构，可以作为服务器运行也可以连接到远程服务器

3. 模块化插件系统

支持动态加载应用模块(apps)和响应模块(response)

提供中间件机制用于消息预处理

4. 支持自定义平台

可根据接口说明对接任意平台

## 🔧 核心组件分析

5. 事件处理器

实现消息去重机制（防止重复处理同一消息）

用户操作频率限制（防止恶意刷屏）

6. Hook 系统

类似 React Hooks 的设计模式

提供 useMessage、useMention 等常用 Hook

简化了消息处理的复杂性

7.  消息格式化系统

支持文本、图片、按钮、Markdown、ARK 卡片等多种消息类型

8. 配置管理系统

支持命令行参数、配置文件、环境变量多层配置

配置动态加载和热更新

## 💡 设计优势

高度模块化：每个功能都是独立的模块，便于维护和扩展

TypeScript 全支持：完整的类型定义，提供良好的开发体验

事件驱动：响应式编程模型，代码逻辑清晰

可扩展性强：支持自定义中间件、Hook 和平台适配器

性能优化：包含消息去重、频率限制、内存清理等优化机制

## 🔄 工作流程

启动阶段：加载配置 → 启动 CBP 服务器 → 连接平台适配器

消息接收：平台消息 → CBP 协议转换 → 事件分发

消息处理：事件选择 → 中间件处理 → 响应函数执行

消息发送：格式化消息 → CBP 协议传输 → 平台发送

## 平台支持情况

| Project               | Status                    | Description |
| --------------------- | ------------------------- | ----------- |
| 👉[@alemonjs/qq-bot]  | [![qq-bot-s]][qq-bot-p]   | QQbot       |
| 👉[@alemonjs/discord] | [![discord-s]][discord-p] | discord     |
| 👉[@alemonjs/onebot]  | [![onebot-s]][onebot-p]   | onebot      |

[@alemonjs/qq-bot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/qq-bot
[qq-bot-s]: https://img.shields.io/npm/v/@alemonjs/qq-bot.svg
[qq-bot-p]: https://www.npmjs.com/package/@alemonjs/qq-bot
[@alemonjs/discord]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/discord
[discord-s]: https://img.shields.io/npm/v/@alemonjs/discord.svg
[discord-p]: https://www.npmjs.com/package/@alemonjs/discord
[@alemonjs/onebot]: https://github.com/lemonade-lab/alemonjs/tree/main/packages/onebot
[onebot-s]: https://img.shields.io/npm/v/@alemonjs/onebot.svg
[onebot-p]: https://www.npmjs.com/package/@alemonjs/onebot

## 生态列表

| Project        | Description                 |
| -------------- | --------------------------- |
| 👉[lvyjs]      | 开发环境(nodejs 捆绑打包器) |
| 👉[alemondesk] | 桌面端版本(react-golang)    |
| 👉[alemongo]   | 服务端版本(react-golang)    |

[nodejs-dev]: https://github.com/lemonade-lab/lvyjs
[alemondesk]: https://github.com/lemonade-lab/alemondesk
[alemongo]: https://github.com/lemonade-lab/alemongo

## 贡献

<a href="https://github.com/lemonade-lab/docs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lemonade-lab/alemonjs" />
</a>

## 联系方式

> QQ Group 1012967625
