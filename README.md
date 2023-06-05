[English](./README_English.md)

## 什么是 Alemon ?

[Alemon](http://ningmengchongshui.gitee.io/lemonade/) ( 发音为 /əˈlemən/ )是一种面向消息正则匹配的更注重于业务逻辑实现的开发框架。

它基于 JavaScript 所构建,并提供了一系列快捷的接口和方法来快速实现业务逻辑。

> 如果你是初学者。不用担心！理解教程和指南的内容只需要具备基础的 JavaScript 知识。

> 我们提供了模板与工程测试插件包来给你快速体验和实现功能~

## 一、快速开始

### 必要环境

> 已安装可忽略此步骤

#### windows

安装[Node.js](https://nodejs.org)

安装[Git](ttps://git-scm.com)

#### Centos

`yum install nodejs`

`yum install git`

### 安装

1.部署工具

```
npm install alemon-cli -g
```

2.初始化

```
alemon-cli init
```

3.加载依赖

```
cd <robot name>
npm install
```

### 运行

```
npm run app  #直接启动
```

## 二、更多详情

后台运行-负载均衡-记录监控

```
npm run start #后台启动
```

倘若遇到问题,可在导航栏处找到`关于-常见问题`

> config/login.yaml 机器登录配置

> config/app.yaml 机器应用配置

#### 扩展指令

```
npm run stop #停止
npm run restart #重启
npm run delete #删除
npm run login #登录
npm run logs #打印
npm run monit #监听管理
npm run kill #杀死实例
npm run uptate #更新工具
npm run redis #linux-redis启动
npm run dev #热开发启动
npm run dev:img #图片调试开发启动
```

## 三、友情链接

官方代码包[☞SDK](https://github.com/tencent-connect/bot-node-sdk)

官方开发文档[☞API](https://bot.q.qq.com/wiki/develop/nodesdk/guild/guilds.html)

## 四、发电赞助

[https://afdian.net/a/lemonade-studio](https://afdian.net/a/lemonade-studio)

## 五、统一开源协议

GNU GPL 是使用最广泛的自由软件许可证,并有强烈的版权要求

分发衍生作品时,作品的源代码必须在同一许可证下可用

GNUGPL 有多种变体,每个变体都有不同的要求
