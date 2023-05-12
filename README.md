<h1 align="center">
 <span> Alemon-Bot</span> 
<a  href='https://github.com/ningmengchongshui/alemon-bot/stargazers'>

[![](https://profile-counter.glitch.me/alemon-bot/count.svg)](https://gitee.com/ningmengchongshui/alemon-bot)

Node.js>=V16

[☞ 参考文档](http://three-point-of-water.gitee.io/point/)

Windows/Linux,Node.js,TypeScript

Express,Redis,Sequelize,PM2

</a>
</h1>

## 频道机器人

一款基于官方 SDK 所构造的频道机器人,让开发者更专注于业务逻辑,是一种面向消息正则匹配的开发模式.

| 指令      | 说明         |
| --------- | ------------ |
| /柠檬帮助 | 查看所有指令 |
| /柠檬版本 | 查看版本记录 |

## 起步

拉取代码

```
#github
git clone --depth=1 https://github.com/ningmengchongshui/alemon-bot.git
#gitee
git clone --depth=1 https://gitee.com/ningmengchongshui/alemon-bot.git
```

加载依赖

```
cd alemon-bot
npm install cnpm -g #全局安装cnpm
cnpm install
```

## 运行

> 以下指令可自行换成 cnpm 或 pnpm

#### 脚本运行 1 登录验证

```
npm run app  #前台运行
```

#### 后台运行 2 负载均衡

```
npm install pm2 -g #安装全局pm2
npm install ts-node -g #安装全局ts-node
```

#### 扩展指令

```
npm run start #运行
npm run stop #停止
npm run restart #重启
npm run delete #删除
npm run login #登录
npm run logs #打印
npm run monit #监听管理
npm run redis #linux-redis启动
npm run dev #热开发启动
npm run dev:img #图片调试开发启动
```

#### 可能出现的问题

1.使用`npm run start`后发现没有生效

或提示`pm2 Modules with id set not found`

```
pm2 update  #更新最新版
pm2 kill   #杀死所有进程
rm -rf ~/.pm2  #删除后重新启动即可
```

2.环境变量问题导致的 pm2 启动失败

```
pm2 env #检查
```

```
pm2 env set PATH "./node_modules/.bin:$PATH"  #添加
```

#### 特殊配置更改

> app.config.ts

> config/config.yaml

## 友情链接

官方代码包[☞SDK](https://github.com/tencent-connect/bot-node-sdk)

官方开发文档[☞API](https://bot.q.qq.com/wiki/develop/nodesdk/guild/guilds.html)

开发交流地 806943302

函数命名部分借鉴于 oicq/icqq

插件设计思想借鉴于 Yunzai-Bot
