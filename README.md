<p align="center"><a href="https://alemonjs.com/" target="_blank" rel="noopener noreferrer"><img width="100" src="https://alemonjs.com/img/alemon.jpg" alt="Vue logo"></a></p>

## AlemonJS [https://alemonjs.com](https://alemonjs.com)

事件匹配的跨平台开发框架,支持 QQ 群、QQ 频道、KOOK、Discord、米游社大别野等平台,只需要一套代码即可快速构建机器人。

提供了热开发和打包编译工具,除此,也能自行混淆压缩来提高机器人响应速度

## Ecosystem

| Project           | Status                                               | Description         |
| ----------------- | ---------------------------------------------------- | ------------------- |
| [alemonjs]        | [![alemonjs-status]][alemonjs-package]               | 应用创建包          |
| [create-alemonjs] | [![create-alemonjs-status]][create-alemonjs-package] | 模板创建脚手架      |
| [afloat]          | [![afloat-status]][afloat-package]                   | 热开发及打包工具    |
| [alemon-ffmpeg]   | [![alemon-ffmpeg-status]][alemon-ffmpeg-package]     | ffmpeg 自动下载安装 |

<p>

[alemonjs]: https://github.com/ningmengchongshui/alemon
[alemonjs-status]: https://img.shields.io/npm/v/alemonjs.svg
[alemonjs-package]: https://www.npmjs.com/package/alemonjs

<p>

[create-alemonjs]: https://github.com/ningmengchongshui/alemon/tree/cli
[create-alemonjs-status]: https://img.shields.io/npm/v/create-alemonjs.svg
[create-alemonjs-package]: https://www.npmjs.com/package/create-alemonjs

<p>

[afloat]: https://github.com/ningmengchongshui/alemon/tree/rollup
[afloat-status]: https://img.shields.io/npm/v/afloat.svg
[afloat-package]: https://www.npmjs.com/package/afloat

<p>

[alemon-ffmpeg]: https://github.com/kongxiangyiren/alemon-ffmpeg
[alemon-ffmpeg-status]: https://img.shields.io/npm/v/alemon-ffmpeg.svg
[alemon-ffmpeg-package]: https://www.npmjs.com/package/alemon-ffmpeg

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

```ts
import { createApp, AMessage, APlugin } from 'alemonjs'
createApp(import.meta.url)
  // 回调写法 比use优先的自由写法
  .on('MESSAGES', e => {
    if (/^你好$/.test(e.msg)) e.reply('你好呀')
  })
  // 继承写法 可直接指定  正则的优先级
  .use({
    word: class word extends APlugin {
      constructor() {
        super({
          // 默认9000, 以 .priority(9000)为准
          priority: 500, // 可有可无
          rule: [
            {
              reg: /^\/滴滴$/,
              fnc: 'post',
              // 默认值,以 上一级为准
              priority: 300 // 500，可有可无
            }
          ]
        })
      }
      async post(e: AMessage) {
        e.reply('哒哒')
      }
    }
  })
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

每当文件有修改或进行保存时就会自动刷新应用

当确认该应用可用于生成环境时,可进行打包操作

```sh
npm run build
```

> 注意,请确保内容修改都是在 npm run dev 下进行

打包完成后,会生成`dist/main.js`和`package.json`文件

该程序可放置于`plugins/your plugin name`文件夹下
