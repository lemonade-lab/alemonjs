import { join } from 'path'
import { getAppPath } from './core/index.js'

const reg =
  /url\(['"](@[^'"]+)['"]\)|href=['"](@[^'"]+)['"]|src=['"](@[^'"]+)['"]/g

const regLocal =
  /url\(['"](~[^'"]+)['"]\)|href=['"](~[^'"]+)['"]|src=['"](~[^'"]+)['"]/g

const imageDir = join(getAppPath(import.meta.url), '../.image')

/**
 * 替换 ~ 字符串
 * @param item
 * @param c
 * @returns
 */
export function replaceLocal(item = '', c = false) {
  return item.replace(regLocal, (match, urlPath, hrefPath, srcPath) => {
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
  })
}

/**
 * 替换 @ 字符串
 * @param dir
 * @param item
 * @param c
 * @returns
 */
export function replaceStr(dir: string, item = '', c = false) {
  return item.replace(reg, (match, urlPath, hrefPath, srcPath) => {
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
  })
}

/**
 * 捕获字符串
 * @param cwd
 * @param val
 * @param reg
 * @param size
 * @returns
 */
export function getStrMatchSize(
  cwd: string,
  val: string,
  reg: RegExp,
  size: number,
  c = false
) {
  const arr = val.match(reg)
  if (!arr) return ''
  return replaceStr(cwd, arr[size], c)
}
