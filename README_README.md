## 目录结构

```Plain
.cache/   浏览器缓存
config/   登录配置
    command.json 指令生成
    config.yaml  配置生成
data/     临时数据
example/  子插件目录
plugins/  插件包目录
    test-plugin/  测试插件
    apps/         应用文件
    db/     数据层
      mysql/ mysql连接
    lib/          工程包
    resources/    资源包
    app.config.ts 路径配置
    app.file.ts   递归文件
    index.ts      导出入口
src/       工程目录
   assets  静态资源
   config  工程配置
   db/     数据层
     redis/ redis连接
   lib/    服务层
      algorithm.ts     算法
      channel.ts       快捷方法
      conversation.ts  会话处理机制
      dealmsg.ts       指令消息处理
      login.ts         机器人登录
      plugins.ts       公共插件类
      puppeteer.ts     puppeteer类
      tool.ts          环境下载
      types.ts         类型控制
   models/ 数据模型
.npmrc           镜像源
index.ts           应用入口
nodemon.json     热开发配置
package.hson     工程管理
tsconfig.ts      TS配置
```

## **框架简介**

index.ts 入口按顺序执行事件,立即定义立即执行

```TypeScript
(async function run(): Promise<void> {
  console.info(green('[HELLO]'), ' 欢迎使用Alemon-Bot ~ ')
  /* 启动redis数据库 */
  redisInit()

  // 下载puppeteer
  await download()

  //  登录
  await check()

  // 创建 client
  global.client = createOpenAPI(cfg)

  // 创建 websocket 连接
  global.ws = createWebsocket(cfg)

  /* 创建会话 */
  createConversation()
})()
```

src/lib/index.ts

#### 消息控制入口

（1）消息对象定义

```TypeScript
interface messgetype {
  eventType: string //消息类型
  event: string //类型转换
  msg: msgType //消息对象
  isGroup: boolean //是否是私聊
  recall: boolean //是否是撤回
  atuid: IUser[] // 艾特得到的qq
  at: boolean // 是否艾特
  isMaster: boolean //是否是管理员
  //消息发送机制
  reply: (content?: any, obj?: any) => Promise<boolean>
  //发送本地图片机制
  sendImage: (content: any, file_image: any) => Promise<boolean>
  //删除表态
  deleteEmoji: (boj: any) => Promise<boolean>
  //发送表态
  postEmoji: (boj: any) => Promise<boolean>
}
```

（2）机制实例原型

```TypeScript
/**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    e.reply = async (content?: any, obj?: any): Promise<boolean> => {
      await client.messageApi
        .postMessage(e.msg.channel_id, {
          msg_id: e.msg.id,
          content,
          ...obj
        })
        .catch((err) => {
          console.log(err)
        })
      return true
    }
    /**
     * 表情表态
     * @param boj 表情对象
     * @param swich 是否转为删除  可选
     */
    e.deleteEmoji = async (boj: any): Promise<boolean> => {
      await client.reactionApi
        .deleteReaction(e.msg.channel_id, boj)
        .catch((err) => {
          console.log(err)
        })
        .catch((err) => {
          console.log(err)
        })
      return true
    }
    e.postEmoji = async (boj: any): Promise<boolean> => {
      await client.reactionApi
        .postReaction(e.msg.channel_id, boj)
        .catch((err) => {
          console.log(err)
        })
        .catch((err) => {
          console.log(err)
        })
      return true
    }
    /**
     * 发送本地图片
     * @param content 消息内容  可选
     * @param file_image 消息图片
     * @returns
     */
    e.sendImage = async (content: any, file_image: any): Promise<boolean> => {
      /* 私聊不能用 */
      if (e.isGroup) return
      await sendImage(e.msg.channel_id, {
        msg_id: e.msg.id, //消息id, 必须
        content,
        file_image //本地图片 路径 必须
      }).catch((err) => {
        console.log(err)
      })
      return true
    }
```

## 插件开发

#### 框架插件指令处理

src/dealmsg/index.ts

```TypeScript
// 初始化指令
export async function init() {
  await loadExample(join(process.cwd(), '/example'))
  await loadProgram(join(process.cwd(), '/program'))
  await loadPlugins(join(process.cwd(), '/plugins'))
  watchC()
}
```

#### 插件导出

plugins/test-plugin/index.ts

识别 plugins/test-plugin/apps 目录下

所有子 ts 文件

并从中导出所有类

```TypeScript
import { red } from 'kolorist'
import { AppName } from './app.config'
import { travel } from './app.file'
const apps = {}
const place = `plugins/${AppName}`
const filepath = `./${place}/apps`
const arr: any = []
travel(filepath, (item: any) => {
  if (item.search('.ts') != -1) {
    arr.push(item)
  }
})
arr.forEach(async (item: any) => {
  const AppDir = `.${item.replace(/\\/g, '/').replace(place, '')}`
  const classObject = await import(AppDir)
  for (const item in classObject) {
    if (classObject[item].prototype) {
      if (apps.hasOwnProperty(item)) {
        console.log(red(`[同名class export]  ${AppDir}`))
      }
      apps[item] = classObject[item]
    } else {
      console.log(red(`[非class export]  ${AppDir}`))
    }
  }
})
export { apps }
```

plugins/test-plugin/api

此处专用于调用 api 插件框架功能

```TypeScript
import plugin from '../../../src/lib/plugins'
import { pluginType, messgetype } from '../../../src/lib/types'
import { showPuppeteer } from '../lib/img'
import * as config from '../db/local/config'
export { plugin, pluginType, messgetype }
export { showPuppeteer, config }
```

调用此 api 可用于 html 截图并发送图片

```TypeScript
import { screenshot } from '../../../src/lib/puppeteer'
export { screenshot }
```

plugins/test-plugin/apps/amin/test.ts

```TypeScript
import { plugin, pluginType, messgetype } from '../../api'
export class test extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      /* 说明集*/
      dsc: '测试类',
      /* 指令集 */
      rule: [
        {
          reg: '^/回答我$', //正则指令
          fnc: 'ontart' //函数匹配10
        },
        {
          reg: '^/艾特我$', //正则指令
          fnc: 'atme' //函数匹配
        },
        {
          reg: '^/私聊我$',
          fnc: 'isGroupp'
        }
      ]
    })
  }

  async ontart(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    /* 框架封装好的消息发送机制 */
    e.reply(`欢迎道友~`)
    return true
  }

  async atme(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    e.reply(`${segment.at(e.msg.author.id)}`)
  }

  async isGroupp(e: messgetype) {
    /* 不允许私聊 */
    if (e.isGroup) return false
    /* 频道转私聊 */
    this.reply(e, '私聊你了哟')
  }
}
```

```TypeScript
import { plugin, showPuppeteer, messgetype, pluginType } from '../../api'
export class show extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      dsc: '显示类',
      rule: [
        {
          reg: '^/来张图片$',
          fnc: 'showImg'
        }
      ]
    })
  }
  async showImg(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    const img = await showPuppeteer({ path: 'map', name: 'map' })
    e.sendImage('', img)
    return false
  }
}

```

```TypeScript
import { messgetype, pluginType } from './types'
export default class plugin {
  /* 字段类型 */
  [parameter: string]: pluginType

   /**
   * @param dsc 插件描述   用于描述对象类型
   * @param event 事件类型
   *
   * 机器人进出 GUILDS
   * 成员进出 GUILD_MEMBERS
   *
   * 下方可能会归类为 message 事件
   * - 表情点击 GUILD_MESSAGE_REACTIONS
   * - 频道 PUBLIC_GUILD_MESSAGES (公)  GUILD_MESSAGES (私)
   * - 私信 DIRECT_MESSAGE
   *
   * 互动事件 INTERACTION
   * 消息审核事件 MESSAGE_AUDIT
   *
   * 论坛事件  OPEN_FORUMS_EVENT （公）  FORUMS_EVENT （私）
   *
   * 音频会话 AUDIO_ACTION
   * @param eventType 消息类型   该事件暂未开始设计（默认排除撤回消息）
   *
   * @param priority 优先级      数字越小优先级越高
   * @param rule.reg 命令正则      RegExp(rule.reg)
   * @param rule.fnc 命令执行方法    function
   */
   constructor({ dsc = 'undifind', event = 'GUILD_MESSAGES', eventType='' ,priority = 500, rule = <any>[] }) {
    /** 描述 */
    this.dsc = dsc

    /** 未定义则默认为message会话 */
    this.event = event

    this.eventType=eventType

    /** 优先级,数字越小越高 */
    this.priority = priority

    /** 正则指令数组,默认为[] */
    this.rule = rule
  }

  /**
   * 专用于在频道中转为私聊回复
   * 需要设置机器人允许私聊
   */
  async reply(e: messgetype, content: string): Promise<boolean> {
    if (e.isGroup) return false
    const postSessionRes: any = await client.directMessageApi
      .createDirectMessage({
        source_guild_id: e.msg.guild_id,
        recipient_id: e.msg.author.id
      })
      .catch((err) => {
        console.log(err)
      })
    if (!postSessionRes) return false
    const {
      data: { guild_id }
    } = postSessionRes
    client.directMessageApi
      .postDirectMessage(guild_id, {
        msg_id: e.msg.id,
        content
      })
      .catch((err) => {
        // err信息错误码请参考API文档错误码描述
        console.log(err)
      })
    return true
  }
}

```

## 框架特殊 API

#### 消息发送机制

```TypeScript
const content = '消息内容'
const obj = {} //可选
e.reply(content,boj)
```

#### 本地图片发送

```TypeScript
const content = '消息内容' //可选
const file_image= '' //本地静态图片地址  必选
e.sendImage(content,file_image)
```

#### 表情表态

```TypeScript
/**
     * 表情表态
     * @param boj 表情对象
     * @param swich  Boolean是否转为删除  可选
 */
e.reaction(boj,swich)
```

## 机制高级用法

#### 特殊消息

（1）标题消息

```TypeScript
// centent 将忽略
e.reply('',{
 embed:{
      title: '欢迎来到大陆',
      prompt: '消息通知',
      thumbnail: {
        url: 'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg',
      },
      fields: [
        {
          name: '道号：柠檬冲水',
        },
        {
          name: '境界：凡人',
        }
      ],
  }
})
```

（2）跳转消息

```TypeScript
//  跳转链接需要报备
e.reply(`欢迎新人`,{
    "ark": {
      "template_id": 23,
      "kv": [
        {
          "key": "#LIST#",
          "obj": [
            {
              "obj_kv": [
                {
                  "key": "desc",
                  "value": "[万宝楼]"
                }
              ]
            },
            {
              "obj_kv": [
                {
                  "key": "desc",
                  "value": "回命丹"
                },
              ]
            },
            {
              "obj_kv": [
                {
                  "key": "desc",
                  "value": "渡劫丹"
                }
              ]
            }
          ]
        }
      ]
    }
})
```

（3）内嵌消息

```TypeScript
e.reply(`<@!${e.msg.user.id}> 我艾特了 ${e.msg.user.username} `)
e.reply(`<@!everyone> 艾特所有人 `)
e.reply(`我发了<emoji:id>这个表情`)
e.reply(`你可以去到这个频道<#${e.msg.channel_id}>`)
```

（4）混合消息

```TypeScript
e.reply(`欢迎新人`,{
   //这是一张欢迎图片
   image: 'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg',
})
```

（5）引用消息

```TypeScript
e.reply('',{
 message_reference:{
      message_id:'' //需要回复的消息id
  }
})
```

(5) 按钮消息

```TypeScript
// centent 将忽略
//需要申请
e.reply('',{
 markdown: {
      template_id: 1,
      params: [
        {
          key: 'title',
          value: ['标题'],
        },
      ],
    },
    msg_id: 'xxxxxx',
    keyboard: {
      id: '123',
    }
})
```

#### 图片制作发送机制

```TypeScript
import { screenshot } from '../../api/rebot'
import { MyDirPath, AppName } from '../../app.config'
/**中间返回show与yunzai的图片方法进行对接*/
export const showPuppeteer = async ({ path = '', name = '', data = {} }): Promise<any> =>
  await screenshot(name, {
    /** heml路径 */
    tplFile: `${MyDirPath}/resources/html/${path}/${name}.html`,
    /** css路径 */
    pluResPath: `${MyDirPath}`,
    /* 插件名 */
    AppName,
    /** 数据 */
    ...data
  }).catch((err) => {
    console.log(err)
  })
import fs from 'fs'
import chokidar from 'chokidar'
import template from 'art-template'
import { green, red, yellow } from 'kolorist'

import { ctrateFilePath } from './algorithm'
import { getImg } from './tool'

/*保存html模板*/
let html = {}
/*监听文件*/
let watcher = {}
/** 计数 */
const watch = (tplFile: string, AdressHtml: string) => {
  /* 已监听 */
  if (watcher[tplFile] && watcher[AdressHtml]) return
  watcher[tplFile] = chokidar.watch(tplFile).on('change', () => {
    delete html[tplFile]
    console.log(yellow('[updata][models][html]'), tplFile)
  })
  watcher[AdressHtml] = chokidar.watch(AdressHtml).on('change', () => {
    console.log(yellow('[updata][models][html]'), AdressHtml)
  })
}

export const screenshot = async (name: string, data = {}) => {
  let { tplFile, AppName = name, saveId = name }: any = data
  /* 生成后的html地址 */
  const AdressHtml = `${process.cwd()}/data/${AppName}/html/${name}/${saveId}.html`
  /*生成后的png地址 */
  const AdressImg = `${process.cwd()}/data/${AppName}/html/${name}/${saveId}.png`
  if (!html[tplFile]) {
    /** 读取html模板 */
    ctrateFilePath(`/data/${AppName}/html/${name}`, process.cwd())
    try {
      html[tplFile] = fs.readFileSync(tplFile, 'utf8')
    } catch (error) {
      console.log(red('[err][models][html]'), tplFile)
      /* 生成失败 */
      return false
    }
    /*监控*/
    watch(tplFile, AdressHtml)
  }
  /*将模板源代码编译成htmldata*/
  let tmpHtml = template.render(html[tplFile], data)
  /* 写入 */
  fs.writeFileSync(AdressHtml, tmpHtml)
  /* 写入成功 */
  console.log(green('[ctreate][models][html]'), AdressHtml)
  /* 截图 */
  await getImg(AdressHtml, 'body', AdressImg)
  /* 返回图片地址 */
  return AdressImg
}
```
