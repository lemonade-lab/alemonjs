import puppeteer, {
  Browser,
  PuppeteerLaunchOptions,
  ScreenshotOptions,
  PuppeteerLifeCycleEvent
} from 'puppeteer'
import queryString from 'querystring'
/**
 * 截图次数
 */
let pic = 0

/**
 *  超过200次截图重启工具
 */
const RestartControl = 200

/**
 * 实例
 */
let browser: Browser

/**
 * 实例控制
 */
let isBrowser = false

/**
 * 实例配置
 */
let LaunchCfg: PuppeteerLaunchOptions

/**
 * 配置浏览器参数
 * @param val 参数值
 */
export function setLanchConfig(val: PuppeteerLaunchOptions) {
  LaunchCfg = val
}

/**
 * 得到pup配置
 * @returns config
 */
export function getLanchConfig() {
  return LaunchCfg
}

/**
 * 启动pup检查
 * @returns 是否启动成功
 */
export async function pupStartCheck() {
  /**
   * 检测是否开启
   */
  if (!isBrowser) {
    const T = await startChrom()
    if (!T) {
      return false
    }
  }
  if (pic <= RestartControl) {
    /**
     * 记录次数
     */
    pic++
  } else {
    /**
     * 重置次数
     */
    pic = 0
    console.info('[puppeteer] close')
    isBrowser = false
    browser.close().catch(err => {
      console.error('[AlemonJS]pup关闭错误', err)
    })
    console.info('[puppeteer] reopen')
    if (!(await startChrom())) return false
    pic++
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
export async function screenshotByFile(
  htmlPath: string | Buffer | URL,
  Options: {
    SOptions: ScreenshotOptions
    tab?: string
    timeout?: number
  }
) {
  const T = await pupStartCheck()
  if (!T) {
    return false
  }
  const { SOptions, tab = 'body', timeout = 120000 } = Options
  try {
    const page = await browser.newPage()
    await page.goto(`file://${htmlPath}`, { timeout })
    const body = await page.$(tab)
    console.info('[puppeteer] success')
    const buff: string | false | Buffer = await body
      .screenshot(SOptions)
      .catch(err => {
        console.error('[puppeteer]', '截图错误', err)
        return false
      })
    await page.close().catch((err: any) => {
      console.error('[puppeteer]', 'page关闭错误', err)
    })
    if (!buff) {
      console.error('[puppeteer]', htmlPath)
      return false
    }
    return buff
  } catch (err) {
    console.error('page实例化错误', err)
    return false
  }
}

/**
 * url截图选项
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

/**
 * 对url截图进行截图
 * @param val url地址
 * @returns buffer
 */
export async function screenshotByUrl(val: urlScreenshotOptions) {
  const T = await pupStartCheck()
  if (!T) {
    return false
  }
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
    const page = await browser.newPage()
    const query = params == undefined ? '' : queryString.stringify(params)
    const isurl = params == undefined ? url : `${url}?${query}`
    await page.setCacheEnabled(cache == undefined ? true : cache)
    // 等待资源加载完成后进行
    await page.goto(isurl, {
      timeout: timeout ?? 120000,
      waitUntil
    })
    console.info(`open ${isurl}`)
    const body = await page.$(tab)
    if (!body) {
      await page.close()
      console.error('tab 获取失败')
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
        console.error('page截图错误', err)
        return false
      })
    await page.close()
    if (!buff) {
      console.error('buff截图错误', url)
      return false
    }
    return buff
  } catch (err) {
    console.error('page实例化错误', err)
    return false
  }
}

/**
 * 启动pup
 * @returns 是否启动
 */
export async function startChrom(): Promise<boolean> {
  try {
    browser = await puppeteer.launch(LaunchCfg)
    isBrowser = true
    console.info('[puppeteer] open success')
    return true
  } catch (err) {
    isBrowser = false
    console.error('[puppeteer] 打开错误', err)
    return false
  }
}
