const { join } = require('path')
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  //适配pnpm
  downloadPath: join(process.cwd(), '.cache', 'puppeteer')
}
