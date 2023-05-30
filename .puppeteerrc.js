const { join } = require('path')
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload: true,
  //适配pnpm
  downloadPath: join(process.cwd(), '.cache', 'puppeteer')
}
