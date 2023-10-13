import { existsSync, readdirSync, cpSync } from 'fs'
import { getAppRegex } from '../alemon/index.js'
import { join } from 'path'

/**
 * 同步挂载文件
 * @param dir 插件目录
 */
export function copyAppsFile(dir: string, control: string[] = []) {
  if (!existsSync(dir)) return
  const flies = readdirSync(dir)
  if (flies.length === 0) return
  const { RegexOpen, RegexClose } = getAppRegex()
  for (const appname of flies) {
    const appPath = join(dir, appname)
    if (RegexOpen.test(appname) && (!RegexClose || !RegexClose.test(appname))) {
      for (const name of control) {
        if (existsSync(`${appPath}/${name}`)) {
          const originalAddress = `${appPath}/${name}`
          const destinationAddress = join(
            process.cwd(),
            `./${name}/.${appname}`
          )
          cpSync(originalAddress, destinationAddress, { recursive: true })
        }
      }
    }
  }
}
