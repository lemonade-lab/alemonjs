import React from 'react'

/**
 * 无头浏览器渲染函数配置参数
 */
export interface ScreenshotFileOptions {
  SOptions?: {
    type: 'jpeg' | 'png' | 'webp'
    quality: number
  }
  tab?: string
  timeout?: number
}

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
   * 插入内容到head
   */
  html_head?: React.ReactNode
  /**
   * 插入内容到body
   */
  html_body?: React.ReactNode
  /**
   * 当且仅当设置别名配置时生效
   * 对别名资源进行解析并植入到html中
   * 目前仅处理css文件
   * 效果等同 <head> <link /> </head>
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
 */
export type RouterType = {
  url: string
  options?: ComponentCreateOpsionType
}[]

export type ObtainProps<T> = T extends React.FC<infer P>
  ? P
  : T extends React.ComponentClass<infer P>
  ? P
  : never
