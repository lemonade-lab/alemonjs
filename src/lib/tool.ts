import { readFileSync, existsSync, createReadStream, PathLike } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { parse } from 'yaml'
import { IOpenAPI } from 'qq-guild-bot'
import { green, red, yellow } from 'kolorist'
import puppeteer, { Browser, BrowserFetcher } from 'puppeteer'
import ProgressBar from 'progress'
import FormData from 'form-data'
import axios from 'axios'
// @ts-ignore
import { PUPPETEER_REVISIONS } from 'puppeteer-core/internal/revisions.js'

declare global {
  var client: IOpenAPI
}

/**
 * 读取配置
 * @param url
 * @returns
 */
export function readYaml(url: string) {
  /* 是否存在 */
  if (existsSync(url)) {
    /* 读取 */
    const file = readFileSync(url, 'utf8')
    const data = parse(file)
    return data
  } else {
    console.log(yellow(`[NOFIND]${url}`))
    return false
  }
}

const getUrl=()=>{
  if (client.config.sandbox) {
    //沙箱环境
    return 'https://sandbox.api.sgroup.qq.com'
  } else {
    //正式环境
    return 'https://api.sgroup.qq.com'
  }
}

/**
 * 执行指令
 * @param command
 * @returns
 */

export function exe(command: string) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
        process.exit()
      } else {
        resolve(stdout)
      }
    })
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
      `Downloading chrome r${PUPPETEER_REVISIONS.chromium} - ${toMegabytes(
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
 * 下载
 * @returns
 */
export function download() {
  return new Promise((resolve, reject) => {
    // 获取puppeteer安装路径
    if (chromePath === '') {
      const browserFetcher = new BrowserFetcher({
        path: join(process.cwd(), '.cache/puppeteer')
      })
      const revisionInfo = browserFetcher.revisionInfo(PUPPETEER_REVISIONS.chromium)
      // 判断是否下载
      if (revisionInfo.local) {
        chromePath = revisionInfo.executablePath
        resolve('完成')
      } else {
        console.log(yellow('[NOFIND]puppeteer,Start downloading, please pay attention to the traffic'))
        // 下载
        browserFetcher
          .download(PUPPETEER_REVISIONS.chromium, onProgress)
          .then((res) => {
            // 获取路径
            chromePath = res.executablePath
            console.log(green('get it done'))
            resolve('下载完成')
          })
          .catch((err) => {
            console.error(red('be defeated'))
            console.error(err)
            reject('失败')
          })
      }
    }
  })
}

// 发送本地图片
export async function sendImage(
  channelID: string,
  message: {
    msg_id: string
    content?: string
    /* 路径类型？ */
    file_image: PathLike
  }
) {
  const url = getUrl()

  /**读取 */
  let picData = createReadStream(message.file_image)

  /* 请求数据包 */
  let formdata = new FormData()
  formdata.append('msg_id', message.msg_id)
  if (typeof message.content === 'string') formdata.append('content', message.content)
  formdata.append('file_image', picData)

  /* 采用请求方式发送数据 */
  return axios({
    method: 'post',
    url: `${url}/channels/${channelID}/messages`,
    headers: {
      'Content-Type': formdata.getHeaders()['content-type'],
      Authorization: `Bot ${client.config.appID}.${client.config.token}`
    },
    data: formdata
  })
  .catch((err:any)=>console.log(red(err)))
}

let pic = 0
let browser: boolean | Browser | void = false
let chromePath: string = ''

let progressBar: ProgressBar = null
let lastDownloadedBytes = 0

function toMegabytes(bytes: number) {
  const mb = bytes / 1024 / 1024
  return `${Math.round(mb * 10) / 10} Mb`
}

/**
 * @description:
 * @param {PathLike} htmlPath html完整路径
 * @param {string} tab html tab标签
 * @param {string} imgPath 生成的图片完整路径
 * @return {Promise<boolean>}
 */
export async function getImg(htmlPath: PathLike, tab: string, imgPath: string): Promise<boolean> {
  if (pic === 0) {
    browser = false
    console.info(green('puppeteer start...'))
    browser = await puppeteer
      .launch({
        executablePath: chromePath,
        headless: true,
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
      .catch((err) => {
        console.error(red(err.toString()))
        if (String(err).includes('correct Chromium')) {
          console.error(
            red('Not installed correctly,try shell:node ./node_modules/puppeteer/install.js')
          )
        }
        return false
      })
    if (typeof browser === 'boolean' && !browser) {
      console.error(red('puppeteer Startup failed'))
      return false
    }
    console.info(green('puppeteer Successfully started'))
  }
  const page = await (browser as Browser).newPage()
  /* 截图工具 */
  await page.goto(`file://${htmlPath}`)
  let body = await page.$(tab)
  await body.screenshot({
    type: 'jpeg',
    quality: 100,
    path: imgPath
  })
  pic++
  // 大于等于30次重开
  if (pic >= 30) {
    ;(browser as Browser).close().catch((err) => console.error(red(err.toString())))
    console.info(green('puppeteer Closed successfully'))
    pic = 0
  }
  return true
}
