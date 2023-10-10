import lodash from 'lodash'
import { join, basename } from 'path'
import { readFileSync, watch, mkdirSync } from 'fs'
import { getAppDir } from './dealmsg.js'
/**
 * 源码缓存
 */
const html = {}
/**
 * 监听器
 */
const watcher = {}
/**
 * 数据缓存
 */
const CacheData = {}
/**
 * 模板缓存
 */
const absolutePathTemplateCache = {}
/**
 * 缓存监听
 * @param tplFile 模板地址
 * @returns
 */
function watchCT(tplFile: string) {
  /**
   * 监听存在,直接返回
   */
  if (watcher[tplFile]) return
  /**
   * 监听不存在,增加监听
   */
  watcher[tplFile] = watch(tplFile)
    .on('change', () => {
      /**
       * 模板改变,删除模板
       */
      delete html[tplFile]
      console.info('[HTML][UPDATA]', tplFile)
    })
    .on('close', () => {
      /**
       * 监听器被移除,删除监听器
       */
      delete watcher[tplFile]
    })
}

/**
 * 如果control为真则需重新用art渲染
 * @param Options
 * @returns
 */
export function createStr(Options: {
  /**
   * 插件名
   */
  AppName: string
  /**
   * 模板地址模板地址
   */
  tplFile: string
  /**
   * 任意数据对象
   */
  data?: any
}) {
  const { AppName, tplFile, data } = Options
  const appDir = getAppDir()
  /**
   * 插件路径
   */
  const basePath = join(process.cwd(), appDir, AppName)
  /**
   * 写入地址
   */
  const AdressHtml = join(process.cwd(), 'data', AppName, basename(tplFile))
  /**
   * 确保写入目录存在
   */
  mkdirSync(join(process.cwd(), 'data', AppName), { recursive: true })
  /**
   * 判断初始模板是否改变
   */
  let control = false
  /**
   * 缓存不存在
   */
  if (!html[tplFile]) {
    /**
     * 读取文件
     */
    html[tplFile] = readFileSync(tplFile, 'utf8')
    /**
     * 读取后监听文件
     */
    watchCT(tplFile)
    control = true
  }
  /**
   * 模板对象不同需要更新数据
   */
  if (!lodash.isEqual(CacheData[tplFile], data ?? {})) {
    CacheData[tplFile] = data ?? {}
    control = true
  }

  /**
   * 模板更改和数据更改都会生成生成html
   */
  if (control) {
    const reg =
      /url\(['"](@[^'"]+)['"]\)|href=['"](@[^'"]+)['"]|src=['"](@[^'"]+)['"]/g
    absolutePathTemplateCache[tplFile] = html[tplFile].replace(
      reg,
      (match, urlPath, hrefPath, srcPath) => {
        const relativePath = urlPath ?? hrefPath ?? srcPath
        /**
         * 去掉路径开头的 @ 符号
         * 转义\/
         */
        const absolutePath = join(basePath, relativePath.substr(1)).replace(
          /\\/g,
          '/'
        )
        if (urlPath) return `url('${absolutePath}')`
        if (hrefPath) return `href='${absolutePath}'`
        if (srcPath) return `src='${absolutePath}'`
      }
    )
    /**
     * 打印反馈生成后的地址
     */
    console.info('[HTML][CREATE]', AdressHtml)
  }

  return {
    control,
    // 模板地址
    AdressHtml,
    // 模板字符
    template: absolutePathTemplateCache[tplFile]
  }
}
