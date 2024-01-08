import { dirname, basename } from 'path'
import { fileURLToPath } from 'url'

/**
 * 应用路径
 * @param url
 * @returns
 */
export function importPath(url: string | URL) {
  const DirPath = getAppPath(url)
  return {
    cwd: () => DirPath,
    name: basename(DirPath)
  }
}

/**
 * 得到执行路径
 * @param url  import.meta.url
 * @returns AppName目录名
 */
export function getAppPath(url: string | URL) {
  return dirname(fileURLToPath(url)).replace(/\\/g, '/')
}

/**
 * 得到执行目录
 * @param {} url import.meta.url
 * @returns AppName目录名
 */
export function getAppName(url: string | URL) {
  return basename(getAppPath(url))
}
