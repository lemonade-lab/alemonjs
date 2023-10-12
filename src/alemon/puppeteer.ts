import puppeteer, {
  Browser,
  PuppeteerLaunchOptions,
  ScreenshotOptions,
  Page
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
 * 对每个页面进行缓存
 */
const pageCache: {
  [key: string]: Page
} = {}

/**
 * 清除缓存
 */
function delCache() {
  for (const item in pageCache) {
    delete pageCache[item]
  }
}

/**
 * 实例配置
 */
let LaunchCfg: PuppeteerLaunchOptions

/**
 * 配置浏览器参数
 * @param val
 */
export function setLanchConfig(val: PuppeteerLaunchOptions) {
  LaunchCfg = val
}

/**
 * 得到pup配置
 * @returns
 */
export function getLanchConfig() {
  return LaunchCfg
}

/**
 * 启动检查
 * @returns
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
    delCache()
    isBrowser = false
    browser.close().catch(err => console.error(err))
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
 * @returns
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
    /**
     * 实例化
     */
    const page = await browser.newPage()
    /**
     * 挂载网页
     */
    await page.goto(`file://${htmlPath}`, {
      timeout
    })
    /**
     * 获取元素
     */
    const body = await page.$(tab)
    /**
     * 得到图片
     */
    console.info('[puppeteer] success')
    const buff: string | false | Buffer = await body
      .screenshot(SOptions)
      .catch(err => {
        console.error(err)
        return false
      })
    /**
     * 关闭
     */
    page.close().catch((err: any) => console.error(err))
    /**
     * 空的
     */
    if (!buff) console.error('[puppeteer]', htmlPath)
    return buff
  } catch (err) {
    console.error(err)
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
  params?: any
  tab?: string
  cache?: boolean
}

/**
 * 截图
 * @param val
 * @returns
 */
export async function screenshotByUrl(val: urlScreenshotOptions) {
  const T = await pupStartCheck()
  if (!T) {
    return false
  }
  const { url, time, rand, params, tab, cache } = val
  if (!pageCache[url]) {
    pageCache[url] = await browser.newPage()
  }
  const isurl =
    params == undefined ? url : `${url}?${queryString.stringify(params ?? {})}`
  /**
   * 启用页面缓存
   */
  await pageCache[url].setCacheEnabled(cache == undefined ? true : cache)
  /**
   * 启动网页
   */
  await pageCache[url].goto(isurl)
  console.info(`open ${isurl}`)
  /**
   * 找到元素
   */
  const body = await pageCache[url].$(tab ?? 'body')
  if (!body) {
    delete pageCache[url]
    console.error(`tab err`)
    return false
  }
  /**
   * 延迟
   */
  await new Promise(resolve => setTimeout(resolve, time ?? 1000))
  /**
   * 截图
   */
  const buff: string | false | Buffer = await body
    .screenshot(
      rand ?? {
        type: 'jpeg',
        quality: 90,
        path: ''
      }
    )
    .catch(err => {
      console.error(err)
      return false
    })
  /**
   * 打印错误
   */
  if (!buff) {
    delete pageCache[url]
    console.error(`buff err:${url}`)
  }
  return buff
}

/**
 * 启动浏览器
 * @returns
 */
export async function startChrom(): Promise<boolean> {
  try {
    browser = await puppeteer.launch(LaunchCfg)
    isBrowser = true
    delCache()
    console.info('[puppeteer] open success')
    return true
  } catch (err) {
    console.error(err)
    isBrowser = false
    delCache()
    console.error('[puppeteer] open fail')
    return false
  }
}
