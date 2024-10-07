import { join } from 'path'
import { readdirSync } from 'fs'
/**
 * 获取指定目录下的所有 ts、js、jsx、tsx 文件
 * @param dir 目录路径
 * @returns 文件路径数组
 */
export const getFiles = (dir: string) => {
  const results: string[] = []
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results.push(...getFiles(fullPath))
    } else if (
      item.isFile() &&
      /\.(ts|js|jsx|tsx)$/.test(item.name) &&
      !item.name.endsWith('.d.ts')
    ) {
      results.push(fullPath)
    }
  })
  return results
}
