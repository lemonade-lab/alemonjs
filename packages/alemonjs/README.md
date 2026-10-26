# [ALemonJS](https://alemonjs.com)

专用于开发聊天机器人的 Node.js 框架，它提供了完整的事件驱动架构来处理各种聊天平台的消息和交互。

官网文档 https://alemonjs.com

## 获取当前应用配置

应用的 `package.json` 声明 `"name": "@example/my-app"`，框架配置 `alemon.config.yaml` 使用完整包名作为键：

```yaml
'@example/my-app':
  enabled: true
```

在该应用中直接调用，无需传入应用名：

```ts
import { getAppConfig } from 'alemonjs';

const config = getAppConfig<{ enabled?: boolean }>();
console.log(config.enabled);
```

`getAppConfig()` 通过 `caller-path` 获取调用路径，并校验直接调用文件。从调用文件目录向上查找带有非空 `name` 的 `package.json`，再读取当前框架配置的同名对象。查找包含 `cwd/package.json`，但绝不越过 `cwd`；符号链接也按真实路径校验边界。

支持 scoped 包名和仅声明 `type` 的构建目录清单。范围内找不到有效包名、清单损坏、调用路径越界或配置类型错误时，只记录 `logger.warn` 并返回 `{}`，不因此抛错或阻止应用运行。已识别应用但未设置同名配置时，正常返回 `{}`。

返回类型为 `Partial<T>`，调用方应处理字段缺失。每次调用读取当前配置；已保存的返回值不会自动替换。返回对象与框架配置共享引用，不应直接修改。公共工具包中包装调用时，识别的是工具包自身。
