/** 数据库初始配置 */
const Rcf = {
  host: '127.0.0.1',
  port: 6379
}

/** 机器人登录默认配置文件 */
const Dcf = '/src/config/config_default.yaml'

/** 机器人登录启动配置文件 */
const Bcf = '/config/config.yaml'

/** 环境配置 */
const Acf = {
  sandbox_api: 'https://sandbox.api.sgroup.qq.com',
  api: 'https://api.sgroup.qq.com'
}

/* 浏览器配置 */
const PuPcf = {
  //浏览器路径
  chromePath: ''
  /**
   * 因部分架构不同可自行配置以正常使用截图功能
   * 如 C:/Users/alemon/Desktop/alemon-bot/.cache/puppeteer/win64-1108766/chrome-win/chrome.exe
   * C:/Users/alemon/Desktop/alemon-bot                   是机器人的根目录
   *.cache/puppeteer/win64-1108766/chrome-win/chrome.exe  是起步时候下载好的浏览器
   * 如果没有下载浏览器,可根据自己的需求下载并配置
   */
}

export { Rcf, Bcf, Dcf, Acf, PuPcf }
