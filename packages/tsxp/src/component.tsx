import React from 'react'
import { renderToString } from 'react-dom/server'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { LinkMain } from './components/link.tsx'
import { createHash } from 'node:crypto'
import { ComponentCreateOpsionType } from './types.ts'

//
const state = '/file'

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
   *
   * @param options
   * @returns
   */
  #rewriteFiles(options: ComponentCreateOpsionType) {
    /**
     *
     * @param _
     * @param p1
     * @returns
     */
    const callback = (_: string, p1: string, p2: string) => {
      // 在 p1 前面加上 "@"
      let p0 = p1 || p2
      const resourcePath = `@${p0}`
      for (const key in options.file_paths) {
        const E = new RegExp(key, 'g')
        p0 = resourcePath.replace(E, options.file_paths[key])
        if (options?.server === true) {
          p0 = this.replaceServerPaths(p0)
        } else {
          p0 = this.replacePaths(p0)
        }
      }
      return `url(${p0})`
    }
    let html_head = options.html_head
    if (Array.isArray(options.html_files)) {
      /**
       * 解析
       */
      for (const url of options.html_files) {
        // 解析样式文件
        if (/(.css|.less|.sass)$/.test(url)) {
          try {
            // 得到解析后的字符
            const data = readFileSync(url, 'utf-8').replace(
              /url\("@([^"]*)"\)|url\('@([^']*)'\)/g,
              callback
            )
            // 使用哈希生产 - 确保根据 url 和内容来生产资源，避免同名资源
            const str = createHash('md5')
              .update(`${url}:${data.substring(0, 12)}`)
              .digest('hex')
            const dir = join(this.#dir, 'css', `${str}.${basename(url)}`)
            // 写入文件。
            writeFileSync(dir, this.replacePaths(data), 'utf-8')
            //
            html_head = (
              <>
                <link rel="stylesheet" href={dir} />
                {html_head ?? ''}
              </>
            )
          } catch (err) {
            console.warn(err)
          }
        }
      }
    }
    return html_head
  }

  /**
   * 编译html
   * @param options
   * @returns
   */
  compile(options: ComponentCreateOpsionType) {
    /**
     * html_files
     */
    if (options?.file_paths && options?.html_files && Array.isArray(options.html_files)) {
      // 修正 head
      options.html_head = this.#rewriteFiles(options)
    }
    const DOCTYPE = '<!DOCTYPE html>'
    const HTML = renderToString(
      <html>
        <head>
          <LinkMain />
          {options?.html_head ?? ''}
        </head>
        <body>{options?.html_body ?? ''}</body>
      </html>
    )
    const html = `${DOCTYPE}${HTML}`
    /**
     * create false
     */
    if (typeof options?.file_create == 'boolean' && options?.file_create == false) {
      // is server  启动 server 解析
      if (options.server === true) return this.replaceServerPaths(html)
      //
      return this.replacePaths(html)
    }
    /**
     * create true
     */
    const dir = join(this.#dir, options?.join_dir ?? '')
    // mkdir
    mkdirSync(dir, { recursive: true })
    // url
    const address = join(dir, options?.html_name ?? 'hello.html')
    // write
    writeFileSync(
      address,
      options.server === true ? this.replaceServerPaths(html) : this.replacePaths(html)
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
   * @returns
   */
  replaceServerPaths = htmlContent => {
    const cwd = process.cwd().replace(/\\/g, '\\/')
    const arg = new RegExp(cwd, 'g')
    // html
    return this.replacePaths(htmlContent.replace(arg, state))
  }

  //
}
