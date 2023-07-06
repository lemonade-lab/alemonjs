const os = require('os')
const { existsSync } = require('fs')
const arch = os.arch()
let skipDownload = false
let executablePath
//win32
if (process.platform == 'win32') {
  if (existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')) {
    // 存在 Edge
    skipDownload = true
    executablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    console.info('[win32] system')
    console.info('[Edge] start')
  }
} else if (process.platform == 'linux') {
  //如果arm64架构跳过下载
  if (arch == 'arm64' || arch == 'aarch64') {
    console.info('[arm64/aarch64] system')
    skipDownload = true
  }
  //不管什么架构,如果存在配置则跳过下载,且配置路径
  if (existsSync('/usr/bin/chromium')) {
    skipDownload = true
    executablePath = '/usr/bin/chromium'
    console.info('[Chromium] start')
  }
}
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload,
  executablePath
}
