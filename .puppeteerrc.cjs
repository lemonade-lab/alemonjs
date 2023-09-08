const os = require('os')
const { existsSync } = require('fs')
const { execSync } = require('child_process')
const arch = os.arch()
/**
 * Downloa
 */
let skipDownload = false
/**
 * Path
 */
let executablePath
/**
 * linux | android
 */
if (process.platform == 'linux' || process.platform == 'android') {
  const chromium = ['chrome-browser', 'chrome', 'chromium-browser', 'chromium', 'firefox']
  /**
   * get path
   */
  for (const item of chromium) {
    try {
      const chromiumPath = execSync(`whereis ${item}`).toString().split(' ')[1]?.trim()
      if (chromiumPath) {
        skipDownload = true
        executablePath = chromiumPath
        console.info(`[Chromium] start ${item}`)
        break
      }
    } catch (error) {
      console.error('Failed to get Chromium path:', error)
      continue
    }
  }
  /**
   * not path
   */
  if (!skipDownload) {
    /**
     * search
     */
    const arr = [
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/usr/bin/chromium-browser',
      '/opt/google/chrome/chrome'
    ]
    for (const item of arr) {
      if (existsSync(item)) {
        skipDownload = true
        executablePath = item
        console.info('[Chromium] start')
        break
      }
    }
  }
  /**
   * arm64/arrch64
   */
  if (arch == 'arm64' || arch == 'aarch64') {
    console.info('[arm64/aarch64] system')
    skipDownload = true
  }
} else if (process.platform == 'win32') {
  /**
   * windows path
   */
  const win32 = {
    Chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    Edge: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  }
  /**
   * win32  Edge
   */
  for (const item in win32) {
    if (existsSync(win32[item])) {
      skipDownload = true
      executablePath = win32[item]
      console.info(`[Win32] start ${item}`)
      break
    }
  }
}
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload,
  executablePath
}
