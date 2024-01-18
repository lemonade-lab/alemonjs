import { join } from 'path'
import { getAppPath } from '../core/index.js'

const imageDir = join(getAppPath(import.meta.url), '../../.image')

/**
 * 替换 ~ 字符串
 * @param item
 * @param c
 * @returns
 */
export function replaceLocal(item = '', c = false) {
  return item.replace(
    /url\(['"](~[^'"]+)['"]\)|href=['"](~[^'"]+)['"]|src=['"](~[^'"]+)['"]/g,
    (match, urlPath, hrefPath, srcPath) => {
      const relativePath = urlPath ?? hrefPath ?? srcPath
      const substr = relativePath.substr(1)
      // 替换@
      const absolutePath = (c ? substr : join(imageDir, substr)).replace(
        /\\/g,
        '/'
      )
      if (urlPath) return `url('${absolutePath}')`
      if (hrefPath) return `href='${absolutePath}'`
      if (srcPath) return `src='${absolutePath}'`
    }
  )
}

/**
 * 替换 @ 字符串
 * @param dir
 * @param item
 * @param c
 * @returns
 */
export function replaceStr(dir: string, item = '', c = false) {
  // 从str中,替换@
  return item.replace(
    /url\(['"](@[^'"]+)['"]\)|href=['"](@[^'"]+)['"]|src=['"](@[^'"]+)['"]/g,
    (match, urlPath, hrefPath, srcPath) => {
      const relativePath = urlPath ?? hrefPath ?? srcPath
      const substr = relativePath.substr(1)
      // 替换@
      const absolutePath = (c ? substr : join(dir, 'public', substr)).replace(
        /\\/g,
        '/'
      )
      if (urlPath) return `url('${absolutePath}')`
      if (hrefPath) return `href='${absolutePath}'`
      if (srcPath) return `src='${absolutePath}'`
    }
  )
}

/**
 * 捕获字符串
 * @param cwd 地址
 * @param val 对应字符
 * @param reg  提取规则
 * @param size 选择数据
 * @returns
 */
export function getStrMatchSize(
  cwd: string,
  val: string,
  reg: RegExp,
  size: number,
  c = false
) {
  // 提取
  const arr = val.match(reg)
  if (!arr) return ''
  // 使用
  return replaceStr(cwd, arr[size], c)
}
