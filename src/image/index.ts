import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readFileSync, cpSync } from 'node:fs'
import { Puppeteer, type ScreenshotFileOptions } from '../core/index.js'
import { getStrMatchSize, replaceLocal } from './utils.js'
import { cache } from './html.js'
import { PuppeteerLaunchOptions } from 'puppeteer'
/**
 * 插入模板
 * @param str
 * @param arr
 * @returns
 */
function render(str: string, arr: { reg: RegExp; val: string }[]) {
  // 传入一个 []  key:reg , val:xxx
  for (const item of arr) {
    str = str.replace(item.reg, item.val)
  }
  return str
}

/**
 * 创建图片对象
 * @param cwd
 */
export function createImage(cwd?: string) {
  // 传进来,设置一些参数
  let ImageCwd = (cwd ?? process.cwd()).replace(/\\/g, '/')

  const im = join(ImageCwd, '.image')
  const y = join(process.cwd(), '.image')

  // 确保目录存在
  mkdirSync(im, { recursive: true })

  // 同步.image文件
  if (y != im) cpSync(im, y, { recursive: true })

  let ImageLate: string

  let ImageHtml: string

  let ImageOptions: ScreenshotFileOptions

  const ImageLink: string[] = []

  // 实例化
  const pup = new Puppeteer()

  // 启动
  pup.start()

  const app = {
    /**
     * 得到配置
     * @returns
     */
    getLaunch: () => pup.getLaunch,
    /**
     * 设置配置
     * @param val
     * @returns
     */
    setLaunch: (val: PuppeteerLaunchOptions) => {
      pup.setLaunch(val)
      return app
    },
    /**
     * 设置 @ 路径
     * @param cwd
     * @returns
     */
    cwd: (cwd?: string) => {
      ImageCwd = (cwd ?? process.cwd()).replace(/\\/g, '/')
      return app
    },
    /**
     * 渲染指定vue文件
     */
    Render: ({
      str,
      data,
      cance
    }: {
      str: string
      data?: any
      cance?: boolean
    }) => {
      /**
       * ********
       * 字符串解析 - 同时替换@ - 插入模板
       * ********
       */
      const html = render(cache, [
        {
          reg: /<ImageStyle\s*\/>/,
          // 提取 替换
          val: getStrMatchSize(
            ImageCwd,
            str,
            /<\s*style\s*>([\s\S]*?)<\/style\s*>/,
            0,
            cance
          )
        },
        {
          reg: /<ImageHead\s*\/>/,
          // 提取 替换
          val: getStrMatchSize(
            ImageCwd,
            str,
            /<\s*head\s*>([\s\S]*?)<\/head\s*>/,
            1,
            cance
          )
        },
        {
          reg: /<ImageTemplate\s*\/>/,
          // 提取 替换
          val: getStrMatchSize(
            ImageCwd,
            str,
            /<\s*template\s*>([\s\S]*?)<\/template\s*>/,
            1,
            cance
          )
        },
        {
          reg: /<ImageScript\s*\/>/,
          // 提取 替换
          val: getStrMatchSize(
            ImageCwd,
            str,
            /<\s*script\s*>([\s\S]*?)<\/script\s*>/,
            0,
            cance
          )
        },
        {
          reg: /<ImageData\s*\/>/,
          // 插入数据
          val: JSON.stringify(data)
        },
        {
          reg: /<ImageDir\s*\/>/,
          // 插入地址
          val: ImageCwd
        }
      ])

      /**
       * ********
       * 解析 替换 ~
       * ********
       */
      ImageHtml = replaceLocal(html, cance)

      return app
    },
    /**
     * 创建html
     * @param param0
     * @returns
     */
    create: ({
      late,
      data = {},
      cance = false
    }: {
      late: string
      data?: any
      cance?: boolean
    }) => {
      ImageLate = late
      // 字符串读取
      const str = readFileSync(join(ImageCwd, ImageLate), 'utf-8')
      // 渲染html
      app.Render({
        str,
        data,
        cance
      })
      return app
    },
    /**
     * 获取html
     * @returns
     */
    getHtml: () => {
      return ImageHtml
    },
    /**
     * 截图
     * @param options
     * @returns
     */
    screenshot: (options?: ScreenshotFileOptions) => {
      ImageOptions = options
      // 写入地址 项目根目录 + 'data' + 文件地址.html
      const directory = join(process.cwd(), 'data', `${ImageLate}.html`)
      // 确保写入目录存在
      mkdirSync(dirname(directory), { recursive: true })
      // 写入文件
      writeFileSync(directory, ImageHtml)
      return pup.toFile(directory, {
        SOptions: ImageOptions?.SOptions ?? { type: 'jpeg', quality: 90 },
        tab: ImageOptions?.tab ?? 'body',
        timeout: ImageOptions?.timeout ?? 120000
      })
    }
  }
  return app
}
