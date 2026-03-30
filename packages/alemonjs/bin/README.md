## alemonc

AlemonJS 项目 CLI 工具，用于配置管理、平台管理、版本更新等。

### 帮助

```sh
npx alemonc -h
```

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
