import { join, basename } from 'path'
import { readFileSync, mkdirSync } from 'fs'
import { APPCONFIG } from '../configs.js'
import { Screenshot } from './puppeteer.js'

/**
 * 对指定html进行资源矫正
 * @param AppName 插件名
 * @param tplFile 文件地址
 * @deprecated 已废弃
 * @returns 文件地址|模板字符串
 */
export function createHtml(AppName: string, tplFile: string) {
  const appDir = APPCONFIG.get('dir')
  // 插件路径
  const basePath = join(process.cwd(), appDir, AppName)
  // 数据路径
  const dataPath = join(process.cwd(), '.data', AppName)
  // 写入地址
  const AdressHtml = join(dataPath, basename(tplFile))
  // 确保写入目录存在
  mkdirSync(dataPath, { recursive: true })
  /// 判断初始模板是否改变
  let control = false
  // 缓存不存在
  if (!Screenshot.html[tplFile]) {
    // 读取文件
    Screenshot.html[tplFile] = readFileSync(tplFile, 'utf8')
    // 读取后监听文件
    Screenshot.watch(tplFile)
    control = true
  }
  // 模板更改和数据更改都会生成生成html
  if (control) {
    const reg =
      /url\(['"](@[^'"]+)['"]\)|href=['"](@[^'"]+)['"]|src=['"](@[^'"]+)['"]/g
    Screenshot.cache[tplFile] = Screenshot.html[tplFile].replace(
      reg,
      (match, urlPath, hrefPath, srcPath) => {
        const relativePath = urlPath ?? hrefPath ?? srcPath
        // 去掉路径开头的 @ 符号 转义\/
        const absolutePath = join(basePath, relativePath.substr(1)).replace(
          /\\/g,
          '/'
        )
        if (urlPath) return `url('${absolutePath}')`
        if (hrefPath) return `href='${absolutePath}'`
        if (srcPath) return `src='${absolutePath}'`
      }
    )
    // 打印反馈生成后的地址
    console.info('html create', AdressHtml)
  }
  return {
    // 模板地址
    AdressHtml,
    // 模板字符
    template: Screenshot.cache[tplFile]
  }
}

/**
 * 如果control为真则需重新渲染
 * 如果key不变而数组元素改变请勿使用缓存
 * @param Options AppName 应用名
 * @param Options tplFile 模板地址模板地址
 * @param Options data 已废弃,任意数据对象
 * @deprecated 已废弃,建议使用createHtml
 * @returns
 */
export function createStr(Options: {
  AppName: string
  tplFile: string
  data?: any
}) {
  return createHtml(Options.AppName, Options.tplFile)
}
