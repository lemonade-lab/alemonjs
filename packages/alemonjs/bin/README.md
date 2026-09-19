## alemonc

ALemonJS 项目 CLI 工具，用于配置管理、平台管理、版本更新等。

### 帮助

```sh
npx alemonc -h
```

---

### 分支管理

```sh
alemonc branch soul-path-v1
```

使用当天本地日期，从当前 HEAD 创建并切换到 `dev-YYYYMMDD-<name>` 分支。
例如在 2026 年 4 月 6 日执行上述命令，会得到 `dev-20260406-soul-path-v1`。
底层执行 `git checkout -b <生成的分支名>`；分支已存在或名称不合法时会报错，不覆盖已有分支。

---

### 配置管理

编辑 `alemon.config.yaml`

#### add — 添加配置项

```sh
alemonc add apps alemonjs-xianyu alemonjs-openai
```

```yaml
apps:
  - 'alemonjs-xianyu'
  - 'alemonjs-openai'
```

#### remove — 移除配置项

```sh
alemonc remove apps alemonjs-openai
```

```yaml
apps:
  - 'alemonjs-xianyu'
```

#### set — 设置配置值

```sh
alemonc set login qq
```

```yaml
login: 'qq'
```

支持嵌套路径：

```sh
alemonc set discord.token 123456
```

```yaml
discord:
  token: 123456
```

#### get — 获取配置值

```sh
alemonc get discord.token
```

#### del — 删除配置项

```sh
alemonc del discord
```

---

### 运行

#### run — 运行指定脚本

```sh
alemonc run [script]
```

#### start — 启动主入口

```sh
alemonc start
```

读取 `package.json` 中的 `main` 入口并启动。

---

### 版本管理

#### version update — 更新 alemonjs 相关包

```sh
alemonc version update
```

读取本地 `package.json`，查找所有 `alemonjs` 和 `@alemonjs/*` 依赖，检查并更新到最新版本。

#### publish — 智能发布当前包

```sh
alemonc publish
alemonc publish patch
alemonc publish prepatch --preid beta
alemonc publish v1.0.33-rc.0
alemonc publish --dry-run
```

源码分支与产物分支：

| 当前源码分支      | 默认产物分支            | git tag                |
| ----------------- | ----------------------- | ---------------------- |
| `main` / `master` | `release`               | 创建并推送 `v<版本号>` |
| `develop`         | `develop-release`       | 不创建、不推送         |
| `feature/login`   | `feature-login-release` | 不创建、不推送         |

`codex/soul-path-v1` 对应 `codex-soul-path-v1-release`，不打 tag。

命令始终构建当前检出的源码分支，非主分支的产物分支名将源码分支名中的所有 `/` 替换为 `-`，再追加 `-release`。detached HEAD 状态下需先切换到源码分支。
`--branch <branch>` 可以覆盖产物目标分支，但不能与当前源码分支相同；是否打 tag 仍由源码分支决定。

```sh
# 在 develop 分支：发布到 develop-release，保持本地版本，不打 tag
alemonc publish
# 在 develop 分支：递增本地版本，发布到 develop-release，不打 tag
alemonc publish prepatch --preid beta
# 在 main 分支：发布到 release，并创建版本 tag
alemonc publish patch
```

版本与打包行为：

- 只有主分支（`main` / `master`）查询 git tag 历史作为版本基线；其他分支只使用本地 `package.json.version`
- 版本格式严格为：
  - 正式版：`v1.0.33`
  - 预发布版：`v1.0.33-alpha.0`、`v1.0.33-beta.0`、`v1.0.33-rc.0`、`v1.0.33-next.0`
- `package.json.version` 保存为不带 `v` 的形式，如 `1.0.33`、`1.0.33-beta.0`
- 不传参数时：
  - 主分支：没有 tag 或本地版本高于最新 tag 时，直接发布本地版本；否则按最新 tag `patch +1`
  - 其他分支：直接发布本地版本，不自动递增，可重复发布更新产物
- 传 `patch/minor/major/prepatch/preminor/premajor/prerelease` 时会自动递增
- 传具体版本号时可写 `v1.0.33` 或 `1.0.33`
- `--preid` 仅允许 `alpha`、`beta`、`rc`、`next`
- 默认先执行 `npm run build`
- 默认发布内容是 `lib/`、`package.json`、`README.md`
- 如果项目配置了 `.npmignore` 或 `package.json.files`，则切换为 npm 文件选择规则
- 获取 npm 文件清单时禁用生命周期脚本（如 `prepack`、`prepare`、`postpack`），避免重复构建和日志干扰；产物生成请放在 `build` 脚本中
- 最终把产物提交并推送到对应的产物分支；仅主分支创建并推送 tag
- 默认要求 git 工作区干净，发布成功后仅在版本变化时自动提交当前源码分支中的 `package.json`
- `--dry-run` 执行构建和文件选择，不推送分支或创建 tag，并恢复本地版本号

---

### 项目诊断

#### info — 输出项目信息

```sh
alemonc info
```

输出内容包括：

- Node.js 版本、系统平台
- 项目名称、版本
- 已安装的 alemonjs 相关包及版本
- `alemon.config.yaml` 配置摘要
- `.env` 环境变量概览
- 包管理器检测

---

### 平台管理

#### platform add — 安装并注册平台

```sh
alemonc platform add discord
alemonc platform add kook
alemonc platform add qq-bot
```

自动安装 `@alemonjs/<name>` 并注册到 `alemon.config.yaml` 的 `platforms` 列表。

#### platform remove — 卸载并移除平台

```sh
alemonc platform remove discord
```

卸载包并从配置中清理。

#### platform list — 列出已安装平台

```sh
alemonc platform list
```

显示所有已安装的 `@alemonjs/*` 平台包及其注册状态。

---

### 登录配置

#### login — 引导式配置平台凭证

```sh
alemonc login discord
alemonc login kook
alemonc login qq-bot
alemonc login onebot
alemonc login telegram
```

根据平台交互式提示输入所需字段：

| 平台     | 必填字段              | 可选字段 |
| -------- | --------------------- | -------- |
| discord  | token                 | —        |
| kook     | token                 | —        |
| qq-bot   | app_id, token, secret | —        |
| onebot   | url                   | token    |
| telegram | token                 | proxy    |

配置保存到 `alemon.config.yaml`，已有值回车可保留。
