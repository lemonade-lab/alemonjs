# ALemonJS 安装指南

目标：从没有 Node.js 的环境创建一个 ALemonJS 机器人开发项目，并验证依赖、测试和构建。

## 1. 检查环境与工作目录

先确认操作系统、终端类型和用户指定的项目父目录，再执行：

```sh
node --version
npm --version
yarn --version
```

命令不存在时按下一节安装。本文新项目使用 Node.js 22 系列的最新补丁版、随 Node.js 安装的 npm，以及 Yarn Classic 1.22.22。框架仓库的 `.nvmrc` 固定为 `22.14.0`，维护框架源码时应按该文件切换；不要把仓库版本锁定误认为所有新项目的最低版本声明。

检查父目录中是否已经有 `alemonjs/` 或 `alemonb/`。目录已存在时先读取其 `package.json`，确定是继续已有项目还是换父目录；不要删除、覆盖已有项目。

## 2. 安装 Node.js 和 npm

### macOS / Linux：使用 nvm

已安装 nvm 时跳过安装脚本，直接加载并安装 Node.js。尚未安装时，按 [nvm 官方安装说明](https://github.com/nvm-sh/nvm#installing-and-updating) 执行以下固定版本的安装脚本（需要 curl、网络以及可用的 bash）：

```sh
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh -o /tmp/alemonjs-install-nvm.sh
bash /tmp/alemonjs-install-nvm.sh
```

在当前终端加载 nvm，然后安装 Node.js：

```sh
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 22
nvm use 22
node --version
npm --version
```

若已有自定义 nvm 安装位置，使用其实际 `NVM_DIR`。Agent 每次启动的新 shell 不一定读取交互式终端配置；后续命令找不到 Node.js 时，应重新加载 `nvm.sh` 并执行 `nvm use 22`。

### Windows：使用官方安装包

1. 打开 [Node.js 官方下载页](https://nodejs.org/en/download)，选择 Node.js 22 系列的最新补丁版、Windows 和匹配机器的架构（x64 或 ARM64）。
2. 下载并运行 `.msi` 安装包，保留 npm 和添加到 PATH 的选项。
3. 安装后重新打开 PowerShell 或命令提示符，运行 `node --version`、`npm --version`。

Windows 原生终端不执行上面的 bash/nvm 命令。若 PowerShell 阻止 `npm.ps1` 或 `yarn.ps1`，可使用 `npm.cmd`、`yarn.cmd`，无需修改整个系统的执行策略。

### 安装 Yarn Classic

先检查 `yarn --version`；已为 `1.22.22` 可跳过安装。模板自带 `yarn.lock`，后续统一使用 Yarn Classic 管理依赖：

```sh
npm install --global yarn@1.22.22
yarn --version
```

如果系统已有 Corepack/Yarn 的命令代理，先确认命令来源及版本，再通过现有工具管理 Yarn；不要使用 `--force` 覆盖未知的全局命令。遇到 `EACCES` 时检查 Node.js 安装位置和权限；macOS/Linux 优先使用用户目录中的 nvm 安装。

## 3. 创建项目

在用户指定的、可写的项目父目录执行：

```sh
npm create alemonjs@latest --yes
cd alemonjs
yarn install
```

`npm create alemonjs` 是基础入口；加 `@latest` 明确选择 npm 上当前发布的脚手架，`--yes` 用于确认 npm 下载运行脚手架的提示，适合无交互 Agent。npm 的初始化行为见 [npm init 文档](https://docs.npmjs.com/cli/v8/commands/npm-init/)。

当前仓库中的脚手架行为：

- 默认复制开发模板到当前目录下的 `alemonjs/`，不会自动执行依赖安装。
- 不支持自定义项目名参数、`--template` 或在当前目录创建的 `.` 参数；不要假定其他脚手架的参数可用。
- 目标目录已存在时输出 `already exists!` 并返回；不能只凭退出码判断创建成功。
- 会生成 `.npmrc`、`.gitignore`、`.npmignore`。其中 `.npmrc` 默认配置 `https://registry.npmmirror.com`，并关闭 npm 的 package-lock 生成。

`@latest` 对应已发布版本，可能与 Git 仓库模板不同。创建后必须检查实际生成的文件和脚本：

```sh
node -e "const fs = require('node:fs'); for (const p of ['package.json', 'app.ts', 'src/index.ts', 'alemon.config.yaml']) { if (!fs.existsSync(p)) throw new Error('Missing: ' + p); } console.log(JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts);"
```

用户希望使用其他目录名时，创建完成后再移动到未被占用的目标目录，并在新目录继续操作。

## 4. 验证开发模板

先阅读生成项目的 `README.md`、`AGENTS.md` 和 `package.json`，确认存在以下脚本再运行：

```sh
yarn test
yarn build
yarn dev --port 17117
```

- `yarn test`：当前仓库模板的 `test/hello.test.ts` 使用 `alemonjs/testing`，不需要机器人账号。该能力需要 AlemonJS 2.1.112 或更新版本；旧的已发布模板可能没有此脚本。
- `yarn build`：调用模板的 lvy 构建，检查退出码和实际构建输出。当前模板包入口为 `lib/index.js`。
- `yarn dev --port 17117`：启动开发进程，可配合 VS Code 的 `ALemonTestOne` 插件本地调试。这是持续运行的命令，不要等它像构建一样自行退出；检查启动日志后用 Ctrl+C 停止，或保留并报告进程状态。

模板的 `alemon.config.yaml` 默认只有语言设置。开发进程启动不代表 QQ、Discord 等真实平台已登录。需要接入平台时，读取对应平台包的 README/配置说明，获取用户提供的配置并进行实际收发验证；不要编造账号、Token 或平台参数，也不要在报告中输出凭据。

## 5. 只需要运行机器人时：bot 模板

在项目父目录执行：

```sh
npm create alemonjs@latest --yes -- --bot
cd alemonb
yarn install
yarn app
```

`--` 后的 `--bot` 会传给脚手架，目录固定为 `alemonb/`。当前 bot 模板只有运行相关脚本，没有 `dev`、`build`、`test`；不要对它执行开发模板的验证命令。运行前仍需按所选平台配置账号和应用。

## 6. 常见问题与 Agent 完成报告

| 现象 | 处理方式 |
| --- | --- |
| `node` / `npm` / `yarn` 找不到 | 检查 PATH、新终端是否加载 nvm，以及命令是否安装在当前 Node.js 环境下。 |
| `alemonjs already exists!` | 检查已有目录；继续已有项目或换父目录，不要删除项目重试。 |
| 下载超时、包不存在 | 分别检查创建阶段 npm 的 registry 和项目 `.npmrc`；记录具体失败包与错误。需要切换源时使用用户允许的 registry，并检查锁文件中的下载地址。 |
| 依赖要求更高 Node.js 版本 | 读取报错中的 engines 要求，切换兼容版本后重新安装；不要用 `--ignore-engines` 掩盖问题。 |
| `Command "test" not found` | 检查实际模板和 `package.json`，说明已发布版本差异或 bot 模板限制。 |
| `alemonjs/testing` 无法导入 | 检查安装的 AlemonJS 版本是否满足 2.1.112，以及依赖安装是否成功。 |
| 端口被占用 | 更换 `--port` 值，不要终止未知服务。 |

完成时报告：项目绝对路径、Node.js/npm/Yarn 版本、实际执行的命令、依赖/测试/构建结果、开发进程是否仍在运行，以及真实平台连接是否验证。未执行或失败的步骤要明确列出，不能把“已生成文件”写成“机器人已上线”。

## 7. 维护 ALemonJS 框架源码仓库

这一流程只用于修改框架、平台包或脚手架本身。在已经克隆的仓库根目录执行：

```sh
nvm install
nvm use
npm install --global yarn@1.22.22
yarn install
yarn build
```

这里 `nvm install` / `nvm use` 读取根目录 `.nvmrc`；Windows 使用匹配版本的 Node.js 安装方式。源码仓库使用 Yarn workspaces，根目录没有 `dev` 脚本；不要在仓库根目录执行新机器人项目的 `yarn dev`。

本文依据 [`create-alemonjs` 源码](../packages-cl/create-alemonjs/src/index.ts)、[开发模板脚本](../packages-cl/create-alemonjs/template/alemonjs/package.json)及 [bot 模板脚本](../packages-cl/create-alemonjs/template/alemonb/package.json)编写。修改脚手架参数、模板目录或启动脚本时应同步更新本指南。
