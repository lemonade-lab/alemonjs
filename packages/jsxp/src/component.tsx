import { renderToString } from 'react-dom/server'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ComponentCreateOpsionType } from './types.ts'

/**
 * 解析路径
 * @param htmlContent
 * @returns
 */
export function PathsCss(htmlContent: string) {
  const regex = /(src|href|url)\s*=\s*["']([^"']*\\[^"']*)["']/g
  htmlContent = htmlContent.replace(regex, (_, p1, p2) => {
    const correctedPath = p2.replace(/\\/g, '/')
    return `${p1}="${correctedPath}"`
  })
  const cssUrlRegex = /url\(["']?([^"'\)\\]*\\[^"'\)]*)["']?\)/g
  return htmlContent.replace(cssUrlRegex, (_, p1) => {
    const correctedPath = p1.replace(/\\/g, '/')
    return `url(${correctedPath})`
  })
}

/**
 * ************
 * 组件解析
 * **********
 */
export class Component {
  //
  #dir = ''
  //
  constructor() {
    this.#dir = join(process.cwd(), 'data', 'component')
    mkdirSync(join(this.#dir, 'css'), {
      recursive: true
    })
    mkdirSync(join(this.#dir, 'img'), {
      recursive: true
    })
  }

  /**
   * 编译html
   * @param options
   * @returns
   */
  compile(options: ComponentCreateOpsionType) {
    const DOCTYPE = '<!DOCTYPE html>'
    const HTML = renderToString(options.component)
    const html = `${DOCTYPE}${HTML}`
    /**
     * create false
     */
    if (typeof options?.create == 'boolean' && options?.create == false) {
      // is server  启动 server 解析
      if (options.server === true) return this.replaceServerPaths(html, options?.mountStatic)
      //
      return this.replacePaths(html)
    }
    /**
     * create true
     */
    const dir = join(this.#dir, options?.path ?? '')
    // mkdir
    mkdirSync(dir, { recursive: true })
    // url
    const address = join(dir, options?.name ?? 'hello.html')
    // write
    writeFileSync(
      address,
      options.server === true
        ? this.replaceServerPaths(html, options?.mountStatic)
        : this.replacePaths(html)
    )
    // url
    return address
  }

  /**
   * 辅助函数：替换路径
   * @param htmlContent
   * @returns
   */
  replacePaths = PathsCss

  /**
   * 辅助函数：替换路径
   * @param htmlContent
   * @param mountStatic
   * @returns
   */
  replaceServerPaths = (htmlContent: string, mountStatic = '/file') => {
    return this.replacePaths(deleteCwd(htmlContent, mountStatic))
  }
}

const deleteCwd = (str: string, mountStatic: string) => {
  if (process.platform == 'win32') {
    // 修掉join路径
    const cwd = process.cwd().replace(/\\/g, '\\\\')
    const arg = new RegExp(cwd, 'g')
    // 修掉URL路径
    const cwd2 = process.cwd().replace(/\\/g, '\\/')
    const arg2 = new RegExp(cwd2, 'g')
    return str.replace(arg, mountStatic).replace(arg2, mountStatic)
  }
  const cwd = process.cwd().replace(/\\/g, '\\/')
  const arg = new RegExp(cwd, 'g')
  return str.replace(arg, mountStatic)
}
