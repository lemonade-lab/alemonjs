import fs from 'fs'
import { join } from 'path'
/**
 * 递归获取所有文件名以 res 开头的文件
 * @param dir 目录路径
 * @returns 文件路径数组
 */
export const getAppsFiles = (dir: string): string[] => {
  let results: string[] = []
  const list = fs.readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getAppsFiles(fullPath))
    } else if (item.isFile() && item.name.startsWith('res')) {
      if (
        item.name.endsWith('.ts') ||
        item.name.endsWith('.js') ||
        item.name.endsWith('.jsx') ||
        item.name.endsWith('.tsx')
      ) {
        results.push(fullPath)
      }
    }
  })
  return results
}
