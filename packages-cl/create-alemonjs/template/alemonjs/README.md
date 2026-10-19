# 机器人

## 开发

推荐使用 vscode `ALemonTestOne` 插件进行本地开发并测试

```sh
# 以指定端口启动开发模式
yarn dev --port 17117
```

### 安装第三方模块

- 编辑 package.json

> 本地新增工作区，扩展模块都安装在 packages，并使用 yarn install 可进行本地模块化

```json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

- 安装

> 下面的方式选其一

```sh
yarn add alemonjs-xxx -W
```

```bash
git clone --depth=1 <url> ./plugins/
```


- 编辑 alemon.config.yaml

```yaml
apps:
  - 'alemonjs-1'
  - 'alemonjs-2'
```

## 单元测试

```sh
yarn test
```

`test/hello.test.ts` 使用 `alemonjs/testing`，无需启动机器人或配置账号。测试保留真实 hooks，在平台动作边界模拟提及结果并检查回复内容与目标。始终通过 `t.after(() => app.dispose())` 清理测试实例。

完整用法参见 [AlemonJS 应用测试指南](https://github.com/lemonade-lab/alemonjs/blob/main/packages/alemonjs/docs/testing.md)。此模板需要包含 `alemonjs/testing` 的 AlemonJS 2.1.112 或更新版本。
