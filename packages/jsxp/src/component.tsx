import { renderToString } from 'react-dom/server'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ComponentCreateOpsionType } from './types.ts'

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
      if (options.server === true) return deleteCwd(html, options?.mountStatic)
      //
      return html
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
    writeFileSync(address, options.server === true ? deleteCwd(html, options?.mountStatic) : html)
    // url
    return address
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
