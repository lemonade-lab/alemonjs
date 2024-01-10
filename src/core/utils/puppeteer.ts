import puppeteer, {
  Browser,
  PuppeteerLaunchOptions,
  ScreenshotOptions,
  PuppeteerLifeCycleEvent
} from 'puppeteer'
import queryString from 'querystring'
import { watch } from 'fs'
import { executablePath } from './pup.js'

export interface ScreenshotFileOptions {
  SOptions: {
    type: 'jpeg' | 'png' | 'webp'
    quality: number
  }
  tab: string
  timeout: number
}

export interface ScreenshotUrlOptions {
  url: string
  time?: number
  rand?: ScreenshotOptions
  params?: queryString.ParsedUrlQueryInput
  tab?: string
  timeout?: number
  cache?: boolean
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
}

class Pup {
  // 截图次数记录
  pic = 0
  // 重启次数控制
  restart = 200
  // 应用缓存
  browser: Browser
  // 状态
  isBrowser = false
  // 配置
  launch: PuppeteerLaunchOptions = {
    headless: 'new',
    timeout: 30000,
    executablePath,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ]
  }
  /**
   * 设置
   * @param val
   */
  setLaunch(val: PuppeteerLaunchOptions) {
    this.launch = val
  }
  /**
   * 获取
   * @returns
   */
  getLaunch(): PuppeteerLaunchOptions {
    return this.launch
  }
  /**
   * 启动pup
   * @returns
   */
  async start() {
    try {
      this.browser = await puppeteer.launch(this.launch)
      this.isBrowser = true
      console.info('[puppeteer] open success')
      return true
    } catch (err) {
      this.isBrowser = false
      console.error('[puppeteer] err', err)
      return false
    }
  }

  /**
   * 启动pup检查
   * @returns 是否启动成功
   */
  async isStart() {
    /**
     * 检测是否开启
     */
    if (!this.isBrowser) {
      const T = await this.start()
      if (!T) {
        return false
      }
    }
    if (this.pic <= this.restart) {
      /**
       * 记录次数
       */
      this.pic++
    } else {
      /**
       * 重置次数
       */
      this.pic = 0
      console.info('[puppeteer] close')
      this.isBrowser = false
      this.browser.close().catch(err => {
        console.error('[puppeteer] close', err)
      })
      console.info('[puppeteer] reopen')
      if (!(await this.start())) return false
      this.pic++
    }
    return true
  }

  /**
   * 截图并返回buffer
   * @param htmlPath 绝对路径
   * @param tab 截图元素位
   * @param type 图片类型
   * @param quality 清晰度
   * @param timeout 响应检查
   * @returns buffer
   */
  async toFile(
    htmlPath: string | Buffer | URL,
    Options: ScreenshotFileOptions
  ) {
    if (!(await this.isStart())) return false
    const { SOptions, tab = 'body', timeout = 120000 } = Options
    try {
      const page = await this.browser.newPage()
      await page.goto(`file://${htmlPath}`, { timeout })
      const body = await page.$(tab)
      console.info('[puppeteer] success')
      const buff: string | false | Buffer = await body
        .screenshot(SOptions)
        .catch(err => {
          console.error('[puppeteer]', 'screenshot', err)
          return false
        })
      await page.close().catch((err: any) => {
        console.error('[puppeteer]', 'page close', err)
      })
      if (!buff) {
        console.error('[puppeteer]', htmlPath)
        return false
      }
      return buff
    } catch (err) {
      console.error('[puppeteer] newPage', err)
      return false
    }
  }

  /**
   * 对url截图进行截图
   * @param val url地址
   * @returns buffer
   */
  async toUrl(val: ScreenshotUrlOptions) {
    if (!(await this.isStart())) return false
    const {
      url,
      time,
      rand,
      params,
      tab = 'body',
      cache,
      timeout,
      waitUntil = 'networkidle2'
    } = val
    try {
      const page = await this.browser.newPage()
      const query = params == undefined ? '' : queryString.stringify(params)
      const isurl = params == undefined ? url : `${url}?${query}`
      await page.setCacheEnabled(cache == undefined ? true : cache)
      // 等待资源加载完成后进行
      await page.goto(isurl, {
        timeout: timeout ?? 120000,
        waitUntil
      })
      console.info('[screenshot] open', isurl)
      const body = await page.$(tab)
      if (!body) {
        await page.close()
        console.error('[screenshot] tab err')
        return false
      }
      await new Promise(resolve => setTimeout(resolve, time ?? 1000))
      const buff: string | false | Buffer = await body
        .screenshot(
          rand ?? {
            type: 'jpeg',
            quality: 90,
            path: ''
          }
        )
        .catch(err => {
          console.error('[screenshot] page body', err)
          return false
        })
      await page.close()
      if (!buff) {
        console.error('[screenshot] buffer err', url)
        return false
      }
      return buff
    } catch (err) {
      console.error('[screenshot] newPage', err)
      return false
    }
  }

  // 解析后的html缓存
  cache: {
    [key: string]: any
  } = {}
  // 模板缓存
  html: {
    [key: string]: any
  } = {}
  // 监听器缓存
  watchCache: {
    [key: string]: any
  } = {}

  /**
   * 缓存监听
   * @param tplFile 模板地址
   */
  watch(tplFile: string) {
    // 监听存在,直接返回
    if (this.watchCache[tplFile]) return
    // 监听不存在,增加监听
    this.watchCache[tplFile] = watch(tplFile)
      .on('change', () => {
        // 模板改变,删除模板
        delete this.html[tplFile]
        console.info('html update', tplFile)
      })
      .on('close', () => {
        // 监听器被移除,删除监听器
        delete this.watchCache[tplFile]
      })
  }
}
export const Screenshot = new Pup()
