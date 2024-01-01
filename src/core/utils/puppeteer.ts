import puppeteer, {
  Browser,
  PuppeteerLaunchOptions,
  ScreenshotOptions,
  PuppeteerLifeCycleEvent
} from 'puppeteer'
import queryString from 'querystring'

/**
 * 截图选项
 */
export interface urlScreenshotOptions {
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
  pic = 0
  restart = 200
  browser: Browser
  isBrowser = false
  launch = {
    headless: process.env?.ALEMONJS_PUPPERTEER_HEADLESS ?? 'new',
    timeout: Number(process.env?.ALEMONJS_PUPPERTEER_TIMEOUT ?? 30000),
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ],
    skipDownload: true
  } as PuppeteerLaunchOptions
  setLaunch(val: PuppeteerLaunchOptions) {
    this.launch = val
  }
  getLaunch() {
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
      console.info('puppeteer open success')
      return true
    } catch (err) {
      this.isBrowser = false
      console.error('puppeteer err', err)
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
      console.info('puppeteer close')
      this.isBrowser = false
      this.browser.close().catch(err => {
        console.error('puppeteer close', err)
      })
      console.info('puppeteer reopen')
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
    Options: {
      SOptions: ScreenshotOptions
      tab?: string
      timeout?: number
    }
  ) {
    if (!(await this.isStart())) return false
    const { SOptions, tab = 'body', timeout = 120000 } = Options
    try {
      const page = await this.browser.newPage()
      await page.goto(`file://${htmlPath}`, { timeout })
      const body = await page.$(tab)
      console.info('puppeteer success')
      const buff: string | false | Buffer = await body
        .screenshot(SOptions)
        .catch(err => {
          console.error('puppeteer', 'screenshot', err)
          return false
        })
      await page.close().catch((err: any) => {
        console.error('puppeteer', 'page close', err)
      })
      if (!buff) {
        console.error('puppeteer', htmlPath)
        return false
      }
      return buff
    } catch (err) {
      console.error('puppeteer newPage', err)
      return false
    }
  }

  /**
   * 对url截图进行截图
   * @param val url地址
   * @returns buffer
   */
  async toUrl(val: urlScreenshotOptions) {
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
      console.info(`screenshot open ${isurl}`)
      const body = await page.$(tab)
      if (!body) {
        await page.close()
        console.error('screenshot tab err')
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
          console.error('screenshot page body', err)
          return false
        })
      await page.close()
      if (!buff) {
        console.error('screenshot buffer err', url)
        return false
      }
      return buff
    } catch (err) {
      console.error('screenshot newPage', err)
      return false
    }
  }
}
export const Screenshot = new Pup()
export const screenshotByFile = Screenshot.toFile
export const screenshotByUrl = Screenshot.toUrl
