## 阿柠檬跨平台开发框架

alemonjs 是消息正则匹配的跨平台开发框架,支持 QQ 群、QQ 频道、KOOK、Discord、米游社大别野等平台,只需要一套代码即可快速构建机器人。

我们提供了热开发和打包编译工具,除此,也能自行混淆压缩来提高机器人响应速度

[开发文档 https://alemonjs.com](https://alemonjs.com)

### 快速开始

可直接执行脚手架 并快速启动程序

```sh
npm init alemonjs@latest -y
cd alemonb
npm install
npm run dev
```

连接平台需要正确配置登录

`a.login.config.ts`

```ts
import { LoginMap } from 'alemonjs'
export const login: LoginMap = {
  // 配置名
  test: {
    // 平台名 qq discord ntqq qq villa
    qq: {
      // ... 配置信息
      // ...详细请看
      // alemonjs.com
    }
  }
}
```

> npm run [脚本名] [配置名] [平台名]

启动时带上匹配规则机器人正确启动

```sh
npm run dev test qq
```

### 开发示例

启动开发模式后会以`apps`作为应用目录

```ts
// apps/word.ts
import { APlugin, AMessage } from 'alemonjs'
// 导出应用 PluginName
export class PluginName extends APlugin {
  constructor() {
    super({
      dsc: '插件描述', // 描述,可有可无
      rule: [
        {
          reg: /你好/, // 响应消息 你好
          fnc: 'post' // 执行函数  post
        }
      ]
    })
  }
  // 定义函数  post
  async post(e: AMessage) {
    // 事件.回复("你好呀")
    e.reply('你好呀')
    // 直接返回 null | undefined | false
    // 不再进行后续的正则匹配
    return
  }
}
```

每当文件有修改或进行保存时就会自动刷新应用

当确认该应用可用于生成环境时,可进行打包操作

```sh
npm run build
```

> 注意,请确保内容修改都是在 npm run dev 下进行

打包完成后,会生成`dist/main.js`和`package.json`文件

该程序可放置于`plugins/your plugin name`文件夹下
