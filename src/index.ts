import express, { Application } from 'express'
import bodyParser from 'body-parser'
import { publicIp } from 'public-ip'
import { BotConfigType, setLanchConfig, cmdInit } from 'alemon'
import { callBack } from './alemon/conversation.js'
import { checkRobot } from './login.js'
import { DefaultConfigLogin, ConfigLogin, PuppeteerConfig, MysConfig } from './config/index.js'

declare global {
  //机器人配置
  var cfg: BotConfigType
}

export async function createAlemon() {
  // 设置浏览器配置
  setLanchConfig(PuppeteerConfig)

  // 登录
  global.cfg = await checkRobot(
    DefaultConfigLogin,
    ConfigLogin,
    process.argv[2] == 'login' ? 0 : 1
  ).catch(err => {
    console.log(err)
    process.exit()
  })

  // 公网
  await publicIp({
    onlyHttps: true,
    timeout: 10000
  })
    .then((ip: any) => {
      console.info('[OPEN]', 'Callback')
      console.info(`http://${ip}:${MysConfig.host}${MysConfig.url}`)
    })
    .catch(err => {
      console.log(err)
      console.log('公网IP识别失败~暂无法支持运行')
      process.exit()
    })

  // 加载插件
  await cmdInit().catch(err => {
    console.log(err)
    return
  })

  // 创建响应
  const app: Application = express()
  // 处理 POST 请求体中的 JSON 数据
  app.use(express.json())
  // 解析 x-www-form-urlencoded 格式的请求体
  app.use(bodyParser.urlencoded({ extended: false }))
  // 处理事件回调请求
  app.post(MysConfig.url, callBack)
  // 启动 Express 应用程序
  app.listen(MysConfig.host, () => {
    console.info('[HELLO] 欢迎使用Alemon-Mys')
    console.info('[DOCS] http://ningmengchongshui.gitee.io/lemonade')
    console.info('[GIT] https://github.com/ningmengchongshui/alemon-bot')
    if (cfg.sandbox) {
      console.info('[DOCS] https://webstatic.mihoyo.com/')
    }
  })
  return true
}
