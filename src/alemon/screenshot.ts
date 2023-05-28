import { readFileSync, writeFileSync } from 'fs'
import { watch } from 'chokidar'
import { render } from 'art-template'
import { ctrateFile } from 'alemon'

import { screenshot } from './puppeteer'

/*保存html模板*/
let html = {}

/*监听文件*/
let watcher = {}

/** 计数 */
const watchC = (tplFile: string, AdressHtml: string) => {
  if (watcher[tplFile] && watcher[AdressHtml]) return

  watcher[tplFile] = watch(tplFile).on('change', () => {
    delete html[tplFile]
    console.info('[HTML][UPDATA]', tplFile)
  })

  watcher[AdressHtml] = watch(AdressHtml).on('change', () => {
    console.info('[HTML][UPDATA]', AdressHtml)
  })
}

export const createPicture = async (name: string, data = {}, address?: string) => {
  let { tplFile, AppName = name, saveId = name }: any = data

  /* 生成后的html地址 */
  const AdressHtml = address
    ? address
    : `${process.cwd()}/data/${AppName}/html/${name}/${saveId}.html`

  if (!html[tplFile]) {
    if (!createHtml(AppName, name, tplFile, AdressHtml)) return false
  }

  /* 写入 */
  writeFileSync(AdressHtml, render(html[tplFile], data))

  /* 写入成功 */
  console.info('[HTML][CREATE]', AdressHtml)

  const Buffer = await screenshot(AdressHtml, 'body').catch((err: any) => console.error(err))
  /* 截图 */
  return Buffer
}

function createHtml(AppName: string, name: string, tplFile: string, AdressHtml: string) {
  /** 创建html目录 */
  ctrateFile(`/data/${AppName}/html/${name}`)

  try {
    html[tplFile] = readFileSync(tplFile, 'utf8')
  } catch (error) {
    console.info('[HTML][ERROR]', tplFile)
    return false
  }

  /*监控*/
  watchC(tplFile, AdressHtml)

  return true
}
