import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'
import { Puppeteer } from '../core/index.js'
import { type ScreenshotFileOptions } from '../core/index.js'
import { getStrMatchSize, replaceLocal } from './utils.js'
import { Cache } from './html.js'
import { PuppeteerLaunchOptions } from 'puppeteer'
import axios from 'axios'

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

type ImageType = {
  cwd?: string
  paths?: {
    [key: string]: string
    'global.js'?: string
  }
}

const GlobalUrl =
  process.env?.ALEMONJS_IMAGE_GLOVAL_JS ??
  'https://registry.npmmirror.com/vue/3/files/dist/vue.global.js'

/**
 * 创建图片对象
 * @param cwd
 */
export function createImage(optoins?: string | ImageType) {
  if (typeof optoins == 'string') {
    // 普通模式
    const optoin = {
      cwd: optoins,
      paths: {
        'global.js': GlobalUrl
      }
    }
    // 替换为新模式
    optoins = optoin
  }
  if (!optoins) {
    optoins = {
      cwd: process.cwd().replace(/\\/g, '/'),
      paths: {
        'global.js': GlobalUrl
      }
    }
  }
  if (!optoins?.cwd) {
    // 不存在
    optoins['cwd'] = process.cwd().replace(/\\/g, '/')
  }
  if (!optoins?.paths) {
    optoins.paths = {
      'global.js': GlobalUrl
    }
  }
  if (!optoins?.paths?.['global.js']) {
    optoins.paths['global.js'] = GlobalUrl
  }

  const cwd = join(process.cwd(), '.image')

  // 确保目录存在
  mkdirSync(cwd, { recursive: true })

  const promises = []
  for (const item in optoins.paths) {
    const dir = join(cwd, item)
    // 不存在文件
    if (!existsSync(dir)) {
      promises.push(
        axios({
          url: optoins.paths[item],
          timeout: 6 * 1000 // 6s
        })
          .then(res => res.data)
          .then(res => {
            writeFileSync(dir, res)
          })
      )
    }
  }
  Promise.all(promises).catch(res => {
    console.error('[Image] 下载失败', res?.config?.url)
    console.error('[Image] 请使用浏览器访问并下载至.image/文件夹')
  })

  let ImageLate: string

  let ImageHtml: string

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
    cwd: (cwd: string) => {
      if (typeof optoins != 'string') optoins.cwd = cwd.replace(/\\/g, '/')
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
      if (typeof optoins != 'string') {
        /**
         * ********
         * 字符串解析 - 同时替换@ - 插入模板
         * ********
         */
        const html = render(Cache.get(), [
          {
            reg: /<ImageStyle\s*\/>/,
            // 提取 替换
            val: getStrMatchSize(
              optoins.cwd,
              str,
              // 可能是多个style标签
              /<\s*(style|style\s*scoped)\s*>([\s\S]*?)<\/style\s*>/,
              0,
              cance
            )
          },
          {
            reg: /<ImageHead\s*\/>/,
            // 提取 替换
            val: getStrMatchSize(
              optoins.cwd,
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
              optoins.cwd,
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
              optoins.cwd,
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
            val: optoins.cwd
          }
        ])

        /**
         * ********
         * 解析 替换 ~
         * ********
         */
        ImageHtml = replaceLocal(html, cance)
      }

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
      if (typeof optoins != 'string') {
        ImageLate = late
        // 字符串读取
        const str = readFileSync(join(optoins.cwd, ImageLate), 'utf-8')
        // 渲染html
        app.Render({
          str,
          data,
          cance
        })
      }
      return app
    },
    /**
     * 获取html
     * @returns
     */
    getHtml: () => ImageHtml,
    /**
     * 截图
     * @param select
     * @returns
     */
    screenshot: (select?: ScreenshotFileOptions) => {
      // 写入地址 项目根目录 + 'data' + 文件地址.html
      const directory = join(process.cwd(), 'data', `${ImageLate}.html`)
      // 确保写入目录存在
      mkdirSync(dirname(directory), { recursive: true })
      // 写入文件
      writeFileSync(directory, ImageHtml)
      return pup.toFile(directory, {
        SOptions: select?.SOptions ?? { type: 'jpeg', quality: 90 },
        tab: select?.tab ?? 'body',
        timeout: select?.timeout ?? 120000
      })
    }
  }
  return app
}
