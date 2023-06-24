const os = require('os')
const { existsSync } = require('fs')
const arch = os.arch()
let skipDownload = false
let executablePath
//win32
if (process.platform == 'win32') {
  if (existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')) {
    // 存在 chrome
    skipDownload = true
    executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    console.log('[chrome] start ~')
  } else if (existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')) {
    // 存在 Edge
    skipDownload = true
    executablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    console.log('[Edge] start ~')
  }
} else if (process.platform == 'linux') {
  //如果arm64架构跳过下载
  if (arch == 'arm64' || arch == 'aarch64') {
    skipDownload = true
  }
  //不管什么架构,如果存在配置则跳过下载,且配置路径
  if (existsSync('/usr/bin/chromium')) {
    skipDownload = true
    executablePath = '/usr/bin/chromium'
    console.log('[chromium] start ~')
  }
}

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload,
  executablePath
}
