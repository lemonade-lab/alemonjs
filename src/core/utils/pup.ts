import { existsSync, realpathSync } from 'fs'
import { execSync } from 'child_process'
const platform = process.platform
const win32Edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
// Path
let executablePath: string
if (process.platform == 'win32' && existsSync(win32Edge)) {
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
  // Downloa
  let skipDownload = false
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
      '/usr/bin/chromium-browser',
      '/data/data/com.termux/files/usr/lib/chromium-browser'
    ]
    for (const item of arr) {
      if (existsSync(item)) {
        executablePath = item
        break
      }
    }
  }
}
/**
 * 得到可寻地址
 * @returns 配置对象
 */
export { executablePath }
