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

> 以下指令可根据需求换成 cnpm/pnpm

#### 脚本运行 1 登录验证

```
npm run app  #前台运行
```

#### 后台运行 2 负载均衡

```
npm install pm2 -g #安装全局pm2
npm install ts-node -g #安装全局ts-node
npm run start #后台启动
```

[☞ 运行失败了?](./README_admin.md)

> config/config.yaml 机器登录配置

> app.config.ts 机器逻辑配置

此时,确保设备已经能正常运行阿柠檬

你可以通过安装测试插件来体验功能

[☞ 测试插件](https://gitee.com/three-point-of-water/point-plugin)

亦或者直接选择功能来制作个性化机器人

[☞ 更多插件](https://gitee.com/three-point-of-water/point)

#### 扩展指令

```
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

## 友情链接

官方代码包[☞SDK](https://github.com/tencent-connect/bot-node-sdk)

官方开发文档[☞API](https://bot.q.qq.com/wiki/develop/nodesdk/guild/guilds.html)
