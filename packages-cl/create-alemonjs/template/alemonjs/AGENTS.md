# Agent 项目指南

## 项目与安装

这是 ALemonJS 通用机器人开发模板，使用 Node.js、TypeScript、Yarn Classic 和 lvyjs。不要假设项目包含修仙游戏、MySQL、Redis 或数据库迁移脚本。

完整的 Node.js 安装与脚手架使用步骤见 [安装指南（适用于 Agent）](https://github.com/lemonade-lab/alemonjs/blob/main/docs/agent-install.md)。如果当前目录已包含本项目，不要再次运行 `npm create alemonjs`。

1. 先读 `package.json`、`README.md`、`alemon.config.yaml` 和相关源码。
2. 准备 Node.js 22 系列、npm 和 Yarn Classic 1.22.22，执行 `yarn install`。
3. 执行 `yarn test` 和 `yarn build`，分别验证测试和构建。
4. 需要本地调试时执行 `yarn dev --port 17117`；这是持续运行的进程，用 Ctrl+C 停止。

`test/hello.test.ts` 使用 `alemonjs/testing`，无需账号；要求 AlemonJS 2.1.112 或更新版本。不要安装全局 TypeScript/ESLint 来替代本项目不存在的检查脚本；以实际 `package.json` 为准。

## 真实目录与入口

- `app.ts`：开发启动入口，加载 `src/index.ts`。
- `src/index.ts`：应用注册与路由。
- `src/response/`：消息处理器。
- `src/image/`、`src/assets/`：图片组件和静态资源。
- `test/`：应用测试。
- `alemon.config.yaml`：框架与平台配置，初始只有语言设置。
- `lvy.config.ts`：开发与构建配置。
- `index.js`：运行入口；构建包入口为 `lib/index.js`。

## 工作与验证原则

- 复用已有模块和消息处理方式，只修改任务需要的文件。
- 保持 ESM 模块写法；不要假设不存在的目录、脚本、配置或业务规则。
- 修改处理器后优先运行相关测试；测试实例通过 `t.after(() => app.dispose())` 清理。
- 接入真实平台时读取对应适配器文档，使用用户提供的账号配置，不输出凭据。
- 区分依赖安装成功、测试通过、构建完成、开发进程启动和真实平台收发验证。
- 无法执行检查时说明原因；完成报告列出执行结果以及是否有后台进程仍在运行。
