import React from 'react'
import { renderToString } from 'react-dom/server'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { getLink } from './link.tsx'
import { createHash } from 'crypto'

/**
 *
 */
export type ComponentCreateOpsionType = {
  /**
   * 扩展路径
   */
  join_dir?: string
  /**
   *生成的文件名
   */
  html_name?: string
  /***
   * 是否保存并返回地址
   * 默认 true
   */
  file_create?: boolean
  /**
   * head组件
   */
  head_component?: React.ReactNode
  /**
   * body组件
   */
  body_component?: React.ReactNode
  /**
   * 插入内容到head
   */
  html_head?: string
  /**
   * 插入内容到body
   */
  html_body?: string
  /**
   * 当且仅当设置别名配置时生效
   * 对别名资源进行解析并植入到html中
   * 目前仅处理css文件
   */
  html_files?: string[]
  /**
   * 设置别名
   */
  file_paths?: {
    [key: string]: string
  }
  /**
   * server 模式
   */
  server?: boolean
}

/**
 *
 * @param htmlContent
 * @returns
 */
export function PathsCss(htmlContent) {
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
  #Link = getLink()
  #dir = ''
  /**
   *
   */
  constructor() {
    this.#dir = join(process.cwd(), '.html')
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

    /**
     * 解析
     */
    for (const url of options.html_files) {
      // 解析样式文件
      if (/(.css|.less|.sass)$/) {
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
          // 携带
          options.html_head = `<link rel="stylesheet" href="${dir}" />${
            options?.html_head ?? ''
          }`
        } catch (err) {
          console.warn(err)
        }
      }
    }
    return options
  }

  /**
   * 编译html
   * @param options
   * @returns
   */
  #compile(options: ComponentCreateOpsionType) {
    /**
     * html_files
     */
    if (
      options?.file_paths &&
      options?.html_files &&
      Array.isArray(options.html_files)
    ) {
      options = this.#rewriteFiles(options)
    }

    /**
     * body_component
     */
    if (options.body_component) {
      const str = renderToString(options.body_component)
      options.html_body = `${str}${options.html_body}`
    }
    /**
     * head_component
     */
    if (options.head_component) {
      const str = renderToString(options.head_component)
      options.html_head = `${str}${options.html_head}`
    }
    /**
     * html
     */
    const DOCTYPE = '<!DOCTYPE html>'
    const head = `<head>${this.#Link}${options?.html_head ?? ''}</head>`
    const body = `<body>${options?.html_body ?? ''}</body>`
    const html = `${DOCTYPE}<html>${head}${body}</html>`
    /**
     * create false
     */
    if (
      typeof options?.file_create == 'boolean' &&
      options?.file_create == false
    ) {
      if (options.server === true) return this.replaceServerPaths(html)
      return this.replacePaths(html)
    }
    /**
     * create true
     */
    const dir = join(this.#dir, options?.join_dir ?? '')
    mkdirSync(dir, { recursive: true })
    const address = join(dir, options?.html_name ?? 'hello.html')
    writeFileSync(
      address,
      options.server === true
        ? this.replaceServerPaths(html)
        : this.replacePaths(html)
    )
    return address
  }

  /**
   * 渲染字符串
   * @param element
   * @param name
   * @returns
   */
  create(element: React.ReactNode, options: ComponentCreateOpsionType) {
    const str = renderToString(element)
    return this.#compile({
      ...options,
      html_body: `${str ?? ''}${options?.html_body ?? ''}`
    })
  }

  /**
   * 路径格式转换
   * @param htmlContent
   * @returns
   */
  replacePaths(htmlContent: string) {
    // 正则表达式匹配 src、href 和 url 中的路径
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
   * 辅助函数：替换路径
   * @param htmlContent
   * @returns
   */
  replaceServerPaths = (htmlContent: string) => {
    // 置换成 /file请求
    return this.replacePaths(
      htmlContent.replace(
        new RegExp(process.cwd().replace(/\\/g, '\\\\'), 'g'),
        '/file'
      )
    )
  }

  /**
   * 将 React 元素渲染为其初始 HTML。这
   * 应该只在服务器上使用。
   * React 将返回一个 HTML 字符串。
   * 您可以使用此方法在服务器上生成 HTML 并在初始请求上发送标记，
   * 以加快页面加载速度并允许搜索 出
   * 于 SEO 目的而抓取您的页面的引擎。
   * 如果你打电话ReactDOMClient.hydrateRoot()在已经具有此服务器渲染标记的节点上，
   * React 将保留它并仅附加事件处理程序，允许您 获得非常高性能的首次加载体验。
   */
  get render() {
    return renderToString
  }
}
