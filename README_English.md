## what Alemon ?

[Alemon](http://three-point-of-water.gitee.io/alemon-bot/) ( pronounce /əˈlemən/ ) is a
more business-logic implementation oriented development framework for message regex matching.

It is built based on JavaScript and provides a series of fast interfaces and methods to
quickly implement business logic.

> if you are a beginner,don't worry! Basic JavaScript knowledge is all you need to understand the content of the tutorials and guides!

> We provide templates and engineering test plug-in packages to give you a quick experience and implement the functionality!

## Quick Start

#### windows

installed[Node.js](https://nodejs.org)

installed[Git](ttps://git-scm.com)

installed[redis-x64.msi](https://github.com/tporadowski/redis/releases)

#### Centos

`yum install nodejs`

`yum install redis`

`yum install git`

### install

1.Deployment tool

```
npm install alemon-cli@latest -g
```

2.Initialize

```
alemon-cli install
```

3.Loading dependence

```
cd <robot name>
npm install cnpm -g
cnpm install
```

### Running

```
npm run app
```

## More details

Backgrounder-Load Balancing-Record Monitoring

the following instructions can be replaced by cnpm/pnpm as required

```
npm install pm2 ts-node -g
npm run start
```

if you run into problems,you can find them in the navigation bar `About-Problem`

> config/config.yaml Machine login configuration

> app.config.ts Machine logic configuaration

#### Explosion Command

```
npm run stop
npm run restart
npm run delete
npm run login
npm run logs
npm run monit
npm run redis
npm run dev
npm run dev:img
```

## Friendly link

Official code pack[☞SDK](https://github.com/tencent-connect/bot-node-sdk)

Official development document[☞API](https://bot.q.qq.com/wiki/develop/nodesdk/guild/guilds.html)

## Sponsor Us

[https://afdian.net/a/threepointofwater](https://gitee.com/link?target=https%3A%2F%2Fafdian.net%2Fa%2Fthreepointofwater)

## Unified open source protocol

The GNU GPL is the most widely used free software license and has strong copyright requirements

When distributing a derivative work, the source code of the work must be available under the same license

There are many variations of GNUGPL, each with different requirements
