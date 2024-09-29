import React from 'react'
import { dirname } from 'path'
import { Picture, createRequire } from 'react-puppeteer'
import Hello, { PropsType } from './conponent/help'
const require = createRequire(import.meta.url)
export const defineOptions = {
  file_paths: {
    // 定位自身的 md文件，并获取目录地址
    '@alemonjs': dirname(require('../../README.md'))
  },
  html_head: (
    <>
      <link href={require('../../public/output.css')} />
      <link href={require('../../public/css/help.css')} />
    </>
  )
}
export class Image extends Picture {
  constructor() {
    // 继承实例
    super()
    // 启动
    this.Pup.start()
  }
  /**
   *
   * @param uid
   * @param Props
   * @returns
   */
  createHelp(Props: PropsType) {
    // 生成 html 地址 或 html字符串
    return this.screenshot({
      // html/help/help.html
      join_dir: 'help',
      html_name: `help.html`,
      html_body: <Hello {...Props} />,
      ...defineOptions
    })
  }
}
// 初始化 图片生成对象
export const imgae = new Image()
