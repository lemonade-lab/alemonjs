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
  /**
   * 因部分架构不同可自行配置以正常使用截图功能
   * 如果启动时没有下载浏览器,可自定配置浏览器路径
   */
  chromePath: '', //浏览器路径
  /**
   * chromePath = 'C:/Users/alemon/Desktop/alemon-bot/.cache/puppeteer/win64-1108766/chrome-win/chrome.exe'
   * 如果启动时下载有浏览器,地址与示例地址应该基本相同
   * C:/Users/alemon/Desktop/alemon-bot
   * 机器人的根目录
   * /.cache/puppeteer
   * 下载地址(如果更改了自定义地址请自行替换)
   * /win64-1108766/chrome-win/chrome.exe
   * 起步时候下载好的浏览器
   */
  downloadPath: '.cache/puppeteer' //自定义下载地址
}

export { Rcf, Bcf, Dcf, Acf, PuPcf }
