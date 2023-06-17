const os = require('os')
let skipDownload = false
let arch = os.arch()
if (arch == 'arm64' || arch == 'aarch64') {
  skipDownload = true
}
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload
}
