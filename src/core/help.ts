import { join } from 'path'
import { readFileSync } from 'fs'
import { APPCONFIG } from './configs.js'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
class Help {
  plugins: object = {}
  get(AppName: string) {
    const c = APPCONFIG.get('regex')
    if (c === false) return {}
    const dir = APPCONFIG.get('route')
    const basePath = join(process.cwd(), dir, `${AppName}.json`)
    return JSON.parse(readFileSync(basePath, 'utf8'))
  }
  create() {
    const c = APPCONFIG.get('regex')
    if (c === false) return
    // 存在app才创建
    if (Object.values(this.plugins).length != 0) {
      // 同时key不能是空数组
      let t = false
      for (const item in this.plugins) {
        if (this.plugins[item] && this.plugins[item].length != 0) {
          t = true
        }
      }
      if (t) {
        const dir = join(process.cwd(), APPCONFIG.get('route'))
        // 不存在
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        // 创建help
        for (const item in this.plugins) {
          if (this.plugins[item] && this.plugins[item].length != 0) {
            const basePath = join(dir, `${item}.json`)
            const jsonData = JSON.stringify(this.plugins[item], null, 2)
            // 异步创建避免阻塞
            writeFile(basePath, jsonData, 'utf-8')
          }
        }
      }
    }
  }
}
export const HELP = new Help()
/**
 * @deprecated 已废弃
 */
export const getPluginHelp = HELP.get
