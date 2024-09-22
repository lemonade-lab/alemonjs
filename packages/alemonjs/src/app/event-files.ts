import fs from 'fs'
import { dirname, join } from 'path'
type DbKey = {
  // 目录
  dir: string
  // 文件路径
  path: string
}
const files: DbKey[] = []
/**
 * 递归获取所有文件名以 res 开头的文件
 * @param dir 目录路径
 * @returns 文件路径数组
 */
const getAppsFiles = (dir: string): string[] => {
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
/**
 *
 * @param url
 * @returns
 */
export const getLoadFiles = (url: string) => {
  const __dirname = dirname(url).replace('file:/', '').replace('file:', '')
  const dir = join(__dirname, 'apps')
  const Filesx = getAppsFiles(dir)
  // 读取config ，根据config对目录进行分类
  for (const item of Filesx) {
    // 保存目录地址和文件地址
    files.push({
      dir: dirname(item),
      path: item
    })
  }
  return files
}
