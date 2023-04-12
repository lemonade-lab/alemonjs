# 频道机器人

插件开发[☞参考文档](./README_README.md)

## 起步

安装 pnpm

```
npm i pnpm -g
```

加载依赖

```
cd alemon-bot
pnpm i
```

## 运行

#### 脚本运行 1

前台运行

```
npm run start
```

#### 解析运行 2

基础环境

```
npm i ts-node -g
```

前台运行

```
ts-node app.ts
```

#### 后台运行 3 负载均衡

基础环境

```
npm install -g pm2
pm2 install typescript
pm2 install ts-node@latest
```

后台运行

```
npm run pm2
```

## linux puppeteer

#### centos

```
yum install pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 -y && yum install libdrm libgbm libxshmfence -y && yum install nss -y && yum update nss -y;
```

安装中文字体

```
yum groupinstall fonts -y
```

#### ubuntu

## 友情链接

官方代码包[☞SDK](https://github.com/tencent-connect/bot-node-sdk)

官方开发文档[☞API](https://bot.q.qq.com/wiki/develop/nodesdk/guild/guilds.html)

函数名命名部分借鉴于oicq/icqq

插件设计思想借鉴于Yunzai-Bot