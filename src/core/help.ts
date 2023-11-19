import { join } from 'path'
import { readFileSync } from 'fs'
import { getAppProCoinfg } from './configs.js'
/**
 * 得到机器人帮助
 * @param AppName
 * @returns 指令对象
 */
export function getPluginHelp(AppName: string) {
  const c = getAppProCoinfg('regex')
  if (c === false) return {}
  const dir = getAppProCoinfg('route')
  const basePath = join(process.cwd(), dir, `${AppName}.json`)
  return JSON.parse(readFileSync(basePath, 'utf8'))
}
