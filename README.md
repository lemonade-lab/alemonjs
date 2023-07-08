> MYS-VILLA-SKD

```
npm init -y
npm i mys-villa
npm install
```

## 启动方法

创建 index.js

```js
import { createClient } from 'mys-villa'
// 实例化
const client = createClient(
  {
    bot_id: '', // 账号
    bot_secret: '', // 密码
    callback_url: '' // 回调地址
    // 比如 /api/mys/callback  即 http://ip:/api/mys/callback
  },
  callBack, // 回调接收函数
  async () => {
    console.log('欢迎使用~')
  }
)
async function callBack(event) {
  console.log('数据包', event)
  /** 已测 获取分组列表 */
  const list = client.getGroupList(event.robot.villa_id)
  console.log(list)
  return
}
```

启动 index.js

```shell
node index.js
```

## 友情链接

官方接口文档[☞API](https://webstatic.mihoyo.com/)

## 开源协议

GNU GPL 是使用最广泛的自由软件许可证,并有强烈的版权要求

分发衍生作品时,作品的源代码必须在同一许可证下可用

GNUGPL 有多种变体,每个变体都有不同的要求
