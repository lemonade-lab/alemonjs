import { BotConfigType, setLanchConfig, cmdInit } from 'alemon'
import { callBack } from './alemon/conversation.js'
import { checkRobot } from './login.js'
import { DefaultConfigLogin, ConfigLogin, PuppeteerConfig, MysConfig } from './config/index.js'
import { createClient, getIP } from './sdk/index.js'

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

  // 加载插件
  await cmdInit().catch(err => {
    console.log(err)
    return
  })

  /* 创建应用程序 */
  const app = createClient(cfg.appID, cfg.token)
  // 处理事件回调请求
  app.post(MysConfig.url, callBack)
  // 启动监听
  app.listen(MysConfig.host, async () => {
    console.info('[HELLO] 欢迎使用Alemon-Mys')
    console.info('[DOCS] http://ningmengchongshui.gitee.io/lemonade')
    console.info('[CODE] https://github.com/ningmengchongshui/alemon-bot')
    if (cfg.sandbox) {
      console.info('[DOCS] https://webstatic.mihoyo.com/')
    }
    const ip = await getIP()
    if (ip) {
      console.info(`[OPEN] http://${ip}:${MysConfig.host}${MysConfig.url}`)
    } else {
      console.log('公网IP识别失败~暂无法支持运行')
    }
  })
  return true
}
