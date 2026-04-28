# 机器人

## 开发

推荐使用 vscode `ALemonTestOne` 插件进行本地开发并测试

```sh
# 以指定端口启动开发模式
yarn dev --port 17117
```

### 安装模块

- 编辑 package.json

> 本地新增工作区，扩展模块都安装在 packages，并使用 yarn install 可进行本地模块化

```json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

- 编辑 alemon.config.yaml

```yaml
apps:
  - 'alemonjs-1'
  - 'alemonjs-2'
```
