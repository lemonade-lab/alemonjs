import { arch } from 'os'
import { existsSync, realpathSync } from 'fs'
import { execSync } from 'child_process'
const isArch = arch()
const platform = process.platform
const win32Edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
// Downloa
let skipDownload = false
// Path
let executablePath: string
if (process.platform == 'win32' && existsSync(win32Edge)) {
  //  win32  Edge
  skipDownload = true
  executablePath = win32Edge
} else if (platform == 'linux' || platform == 'android') {
  // linux | android
  const chromium = [
    'whereis chrome-browser',
    'whereis chrome',
    'whereis chromium-browser',
    'whereis chromium',
    'whereis firefox'
  ]
  // get path
  for (const item of chromium) {
    try {
      const chromiumPath = execSync(item).toString().split(' ')[1]?.trim()
      if (chromiumPath) {
        skipDownload = true
        executablePath = realpathSync(chromiumPath)
        break
      }
    } catch (error) {
      continue
    }
  }
  // not path
  if (!skipDownload) {
    /**
     * search
     */
    const arr = [
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      '/usr/bin/chromium-browser'
    ]
    for (const item of arr) {
      if (existsSync(item)) {
        skipDownload = true
        executablePath = item
        break
      }
    }
  }
  //  arm64/arrch64
  if (isArch == 'arm64' || isArch == 'aarch64') {
    skipDownload = true
  }
}

/**
 * 得到pup可寻地址
 * @type {import("puppeteer").Configuration}
 * @returns 得到配置对象
 */
export function getPupPath() {
  return {
    skipDownload,
    executablePath
  }
}
