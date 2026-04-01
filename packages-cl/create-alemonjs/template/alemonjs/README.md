# 机器人

必要环境 `nodejs` 、`redis` 、`chrome`

该扩展推荐使用`alemongo`作为生产环境

https://github.com/lemonade-lab/alemongo

## 安装

> 安装后使用 `/help` 唤醒

## 开发

推荐使用 vscode `ALemonTestOne` 插件进行本地开发并测试

```yaml
# 开启协议端口，默认0不开启
# port: 17117
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
