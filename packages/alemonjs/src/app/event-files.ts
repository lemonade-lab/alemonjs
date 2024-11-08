import { readdirSync, Dirent, existsSync } from 'fs'
import { join } from 'path'
/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
export const getDirFiles = (
  dir: string,
  condition: (func: Dirent) => boolean = item => /^res(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name)
): {
  path: string
  name: string
}[] => {
  //
  let results: {
    path: string
    name: string
  }[] = []
  if (!existsSync(dir)) return results
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getDirFiles(fullPath, condition))
    } else if (item.isFile() && condition(item)) {
      results.push({
        path: fullPath,
        name: item.name
      })
    }
  })
  return results
}
