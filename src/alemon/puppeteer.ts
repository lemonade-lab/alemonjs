import { PathLike } from 'fs'
import { join } from 'path'
import ProgressBar from 'progress'
import { ScreenshotType } from 'alemon'
// @ts-ignore
import puppeteer, { Browser, BrowserFetcher, PUPPETEER_REVISIONS } from 'puppeteer'

// 非依赖引用
import { PuPcf } from '../../app.config'

let pic: number = 0

//重启控制
const RestartControl: number = 30

let browser: boolean | Browser | void = false

//浏览器路径
let chromePath: string = PuPcf.chromePath

let progressBar: ProgressBar = null

let lastDownloadedBytes: number = 0

function toMegabytes(bytes: number) {
  const mb = bytes / 1024 / 1024
  return `${Math.round(mb * 10) / 10} MB`
}

const PUcf = '.cache/puppeteer'

/**
 * 下载
 * @returns
 */
export function download() {
  return new Promise((resolve, reject) => {
    if (chromePath == '') {
      const browserFetcher = new BrowserFetcher({
        path: join(process.cwd(), PUcf)
      })
      const revisionInfo = browserFetcher.revisionInfo(PUPPETEER_REVISIONS.chromium)
      if (revisionInfo.local) {
        chromePath = revisionInfo.executablePath
        resolve('完成')
      } else {
        console.info('[Chromium]开始下载,请耐心等候~')
        browserFetcher
          .download(PUPPETEER_REVISIONS.chromium, onProgress)
          .then(res => {
            if (res && res.executablePath) {
              chromePath = res.executablePath
              resolve('完成')
            } else {
              console.error('[Chromium]下载浏览器时出现错误')
              console.error('[Chromium]请配置app.config.ts')
              console.error('[Chromium]PuPcf.chromePath="自定义路径"')
              reject('失败')
            }
          })
          .catch(err => {
            console.error(err)
            reject('失败')
          })
      }
    } else {
      console.info('[Chromium]启用自定义配置')
      resolve('完成')
    }
  })
}

/**
 * 下载进度条
 * @param downloadedBytes
 * @param totalBytes
 */
function onProgress(downloadedBytes: number, totalBytes: any) {
  if (!progressBar) {
    progressBar = new ProgressBar(
      `正在下载 Chromium r${PUPPETEER_REVISIONS.chromium} - ${toMegabytes(
        totalBytes
      )} [:bar] :percent :etas `,
      {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: totalBytes
      }
    )
  }
  const delta = downloadedBytes - lastDownloadedBytes
  lastDownloadedBytes = downloadedBytes
  progressBar.tick(delta)
}

/**
 * 截图并返回buffer
 * @param htmlPath
 * @param tab
 * @returns
 */
export async function screenshot(
  htmlPath: PathLike,
  tab: string,
  type?: ScreenshotType,
  quality?: number
): Promise<boolean | Uint8Array | string> {
  if (browser === false) {
    if (!(await startChrom())) return false
  }
  if (pic <= RestartControl) {
    pic++
    const Bufferdata = await startPage(htmlPath, tab, type, quality)
    return Bufferdata
  } else {
    pic = 0
    {
      ;(browser as Browser).close().catch(err => console.error(err))
    }
    console.info('[puppeteer]过载关闭~')
    browser = false
    console.info('[puppeteer]重启准备~')
    if (!(await startChrom())) return false
    pic++
    const Bufferdata = await startPage(htmlPath, tab, type, quality)
    return Bufferdata
  }
}

const startPage = async (
  htmlPath: PathLike,
  tab: string,
  type?: ScreenshotType,
  quality?: number
) => {
  try {
    console.log('[puppeteer]开始截图~')
    /* 实例化 */
    const page = await (browser as Browser).newPage()
    /* 截图 */
    await page.goto(`file://${htmlPath}`)
    /*  */
    let body = await page.$(tab)
    /* 得到图片 */
    const Buffer = await body.screenshot({
      type: type ? type : 'jpeg',
      quality: quality ? quality : 70
    })
    console.info('[puppeteer]截图成功~')
    return Buffer
  } catch (err) {
    console.error(err)
    return false
  }
}

const startChrom = async () => {
  console.info('[puppeteer]准备开始~')
  browser = await getChrome()
  if (typeof browser === 'boolean' && !browser) {
    console.error('[puppeteer]启动失败！')
    return false
  }
  console.info('[puppeteer]成功启动！')
  return true
}

const getChrome = async () => {
  return await puppeteer
    .launch({
      executablePath: chromePath,
      headless: 'new',
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
      ]
    })
    .catch(err => {
      console.error(err)
      console.info('[puppeteer]若未自定义配置则未成功安装~')
      console.info('[puppeteer]反之请检查自定义路径是否正确~')
      return false
    })
}
