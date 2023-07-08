import express, { Application } from 'express'
import bodyParser from 'body-parser'
import { ip } from './alemon/ip.js'
import { BotConfigType, setLanchConfig, cmdInit } from 'alemon'
import { callBack } from './alemon/conversation.js'
import { getLocalImg } from './alemon/localimage.js'
import { checkRobot } from './login.js'
import { DefaultConfigLogin, ConfigLogin, PuppeteerConfig, MysConfig } from './config/index.js'
import { createClient } from './sdk/axois.js'

declare global {
  //机器人配置
  var cfg: BotConfigType
  var client: any
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

  /* 创建请求工具包 */
  global.client = createClient(cfg.appID, cfg.token)

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
  // 处理图片请求
  app.get('/api/mys/img/:filename', getLocalImg)
  // 处理事件回调请求
  app.post(MysConfig.url, callBack)
  // 启动 Express 应用程序
  app.listen(MysConfig.host, async () => {
    console.info('[HELLO] 欢迎使用Alemon-Mys')
    console.info('[DOCS] http://ningmengchongshui.gitee.io/lemonade')
    console.info('[CODE] https://github.com/ningmengchongshui/alemon-bot')
    if (cfg.sandbox) {
      console.info('[DOCS] https://webstatic.mihoyo.com/')
    }
    if (ip) {
      console.info(`[OPEN] http://${ip}:${MysConfig.host}${MysConfig.url}`)
    } else {
      console.log('公网IP识别失败~暂无法支持运行')
    }
  })
  return true
}
