const { join } = require('path')
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // 下载到项目根目录 适配pnpm
  downloadPath: join(__dirname, '.cache', 'puppeteer')
}
