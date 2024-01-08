# AlemonJS [https://alemonjs.com](https://alemonjs.com)

<div align="center">
  <a 
  href="https://alemonjs.com/" 
  target="_blank" 
  rel="noopener noreferrer">
  <img 
   width="256" 
   height="128"
   src="https://alemonjs.com/img/alemon.jpg" 
   alt="AlemonJS LOGO"
   >
  </a>
</div>

<div align="center">
  
事件驱动的跨平台开发框架,支持 QQ (群&频道)、KOOK、Discord、米游社大别野等平台

</div>

### Ecosystem

| Project           | Status                                               | Description     |
| ----------------- | ---------------------------------------------------- | --------------- |
| [alemonjs]        | [![alemonjs-status]][alemonjs-package]               | 标准应用解析器  |
| [create-alemonjs] | [![create-alemonjs-status]][create-alemonjs-package] | 模板创建脚手架  |
| [afloat]          | [![afloat-status]][afloat-package]                   | 应用构建工具    |
| [alemon-ffmpeg]   | [![alemon-ffmpeg-status]][alemon-ffmpeg-package]     | ffmpeg 自动下载 |
| [alemon-onebot]   | [![alemon-onebot-status]][alemon-onebot-package]     | OneBot 协议平台 |

>

[alemonjs]: https://github.com/ningmengchongshui/alemonjs
[alemonjs-status]: https://img.shields.io/npm/v/alemonjs.svg
[alemonjs-package]: https://www.npmjs.com/package/alemonjs

>

[create-alemonjs]: https://github.com/ningmengchongshui/alemonjs/tree/create-alemonjs
[create-alemonjs-status]: https://img.shields.io/npm/v/create-alemonjs.svg
[create-alemonjs-package]: https://www.npmjs.com/package/create-alemonjs

>

[afloat]: https://github.com/ningmengchongshui/alemonjs/tree/rollup
[afloat-status]: https://img.shields.io/npm/v/afloat.svg
[afloat-package]: https://www.npmjs.com/package/afloat

>

[alemon-ffmpeg]: https://github.com/kongxiangyiren/alemon-ffmpeg
[alemon-ffmpeg-status]: https://img.shields.io/npm/v/alemon-ffmpeg.svg
[alemon-ffmpeg-package]: https://www.npmjs.com/package/alemon-ffmpeg

>

[alemon-onebot]: https://github.com/ningmengchongshui/alemonjs/tree/alemon-onebot
[alemon-onebot-status]: https://img.shields.io/npm/v/alemon-onebot.svg
[alemon-onebot-package]: https://www.npmjs.com/package/alemon-onebot

### Quick Start

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

### Development Examples

- 模板继承

继承写法可使用多个配置函数

```ts
import { createApp, AMessage, APlugin } from 'alemonjs'
class word extends APlugin {
  constructor() {
    super({
      // 默认9000, 以 .priority()为准
      priority: 500,
      rule: [
        {
          reg: /^\/滴滴$/,
          fnc: 'post',
          // 默认值,以 上一级 priority 为准
          priority: 300
        }
      ]
    })
  }
  async post(e: AMessage) {
    e.reply('哒哒')
  }
}
createApp(import.meta.url)
  .use({ word })
  // 把所有 / 或 # 开头的消息 替换为 /
  // 表示#滴滴 和 /滴滴 消息一致
  .replace(/^(#|\/)/, '/')
  // 修改 顶部优先级 默认值为 9000
  .priority(8000)
  // 可修改 e
  .reSetEvent(e => e)
  // 扩展 post 为 async post(e,control1,control2){}
  .setArg(e => [() => 'I am control2', () => 'I am control2'])
  // 挂载
  .mount()
```

- 自由回调

比继承优先的自由写法

```ts
import { createApp, AMessage, APlugin } from 'alemonjs'
createApp(import.meta.url)
  .on('MESSAGE', e => {
    if (/^你好$/.test(e.msg)) e.reply('你好呀', e.user_name)
  })
  .on('GUILD_MEMBERS', e => {
    console.log('成员', e.user_name, '加入')
  })
```

每当文件有修改或进行保存时就会自动刷新应用

当确认该应用可用于生成环境时,可进行打包操作

```sh
npm run build
```

打包完成后,会生成`dist/main.js`和`dist/package.json`文件

该程序可放置于`plugins/your plugin name`文件夹下

# Unknown file ".ts"

node >= 20.0.0

```ts
ts-node alemon.config.ts
```

更改为

```ts
node --no-warnings=ExperimentalWarning --loader ts-node/esm alemon.config.ts
```

### Dependencies

```json
{
  "axios": "接口",
  "file-type": "文件类型判断",
  "form-data": "文件流",
  "image-size": "图片大小",
  "koa": "服务框架",
  "lodash-es": "工具包",
  "mime-types": "文件类型",
  "protobufjs": "新文件格式",
  "public-ip": "公网识别",
  "puppeteer": "浏览器",
  "qrcode": "二维码",
  "ws": "连接协议"
}
```

### Community

QQ Group 806943302
