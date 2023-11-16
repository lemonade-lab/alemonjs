# 测试

> 拉取仓库

```sh
git clone --depth=1 -b main https://gitee.com/ningmengchongshui/alemon.git

cd alemon
```

> 安装依赖

```sh
npm install
```

> 编译

```sh
npm run tsc
```

> 把包发布到全局

```sh
npm link
```

> 从全局中 copy 一份

```sh
npm link alemonjs
```

> 删除 alemonjs 内依赖

```sh
rm -rf node_modules/alemonjs/node_modules/
```

> 更改 ts 配置 tsconfig.json

> 增加翻译 plugins 目录

```json
{
  "include": ["plugins", "src/**/*"]
}
```

> 增加登录配置 a.login.config.ts

> 书写插件

plugins/point/main.ts

```ts
import { buildTools } from 'alemon-rollup'
import { createApps, getAppName, getAppProCoinfg } from 'alemonjs'
const hello = await buildTools(
  getAppName(import.meta.url),
  getAppProCoinfg('dir')
)
const apps = createApps(import.meta.url)
apps.component(hello)
apps.mount()
console.log('[APP] 测试插件 启动')
```

plugins/point/config.ts

```ts
import { getAppPath } from 'alemonjs'
import { basename } from 'path'
export const DirPath = getAppPath(import.meta.url)
export const AppName = basename(DirPath)
```

plugins/point/apps/word.ts

```ts
import { APlugin, AMessage, getPluginHelp, Controller } from 'alemonjs'
import { oImages, AppName } from '../../api.js'
export class TestShow extends APlugin {
  constructor() {
    super({
      rule: [
        {
          reg: /^(#|\/)?你好.*$/,
          fnc: 'hello',
          dsc: '/你好',
          doc: '获取所有指令'
        },
        {
          reg: /^(#|\/)?个人信息.*$/,
          fnc: 'information',
          dsc: '/information',
          doc: '获取所有指令'
        }
      ]
    })
  }
  /**
   * @param e 消息对象
   * @returns
   */
  async hello(e: AMessage) {
    const Message = e.Message()
    Message.reply('你好')
    Message.pinning()
    return true
  }
  /**
   * @param e 消息对象
   * @returns
   */
  async information(e: AMessage) {
    const Member = e.Member()
    // 该用户信息
    console.log('data', await Member.information())
    return true
  }
}
```
