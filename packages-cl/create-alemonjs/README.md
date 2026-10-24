# create-alemonjs

ALemonJS 项目脚手架。完整环境准备和验证步骤见 [安装指南（适用于 Agent）](https://github.com/lemonade-lab/alemonjs/blob/main/docs/agent-install.md)，包含 Node.js 和 Yarn 的安装方法。

## 创建开发项目

准备好 Node.js 22 系列与 Yarn Classic 1.22.22 后，在项目父目录执行：

```sh
npm create alemonjs@latest --yes
cd alemonjs
yarn install
yarn test
yarn build
yarn dev --port 17117
```

`test` 以实际发布模板的 `package.json` 为准。开发进程启动后持续运行，用 Ctrl+C 停止；真实平台连接还需配置账号。

## 创建 bot 项目

```sh
npm create alemonjs@latest --yes -- --bot
cd alemonb
yarn install
yarn app
```

bot 模板没有 `dev`、`test`、`build` 脚本。

## Agent 注意事项

- `--yes` 确认 npm 下载提示；`-- --bot` 将选项传给脚手架。
- 默认目录固定为 `alemonjs/`，bot 目录固定为 `alemonb/`，不支持自定义项目名参数。
- 目标目录已存在时不复制；需检查文件，不能只凭退出码判断成功。
- 脚手架只复制模板，不自动安装依赖。
- 生成的 `.npmrc` 默认使用 npmmirror，项目依赖使用 Yarn Classic 安装。
- `@latest` 使用 npm 已发布版本；执行命令前核对生成项目的实际脚本。
