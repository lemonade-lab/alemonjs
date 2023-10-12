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
  console.info('[Win32 Edge] start')
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
        console.info('[Chromium] start')
        break
      }
    } catch (error) {
      console.error('Failed to get Chromium path:', error)
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
        console.info('[Chromium] start')
        break
      }
    }
  }
  //  arm64/arrch64
  if (isArch == 'arm64' || isArch == 'aarch64') {
    console.info('[arm64/aarch64] system')
    skipDownload = true
  }
}
/**
 * @type {import("puppeteer").Configuration}
 */
export function getPupPath() {
  return {
    skipDownload,
    executablePath
  }
}
