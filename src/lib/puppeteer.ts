import fs from 'fs'
import chokidar from 'chokidar'
import template from 'art-template'
import { green, red, yellow } from 'kolorist'

import { ctrateFilePath } from './algorithm'
import { getImg } from './tool'

/*保存html模板*/
let html = {}
/*监听文件*/
let watcher = {}
/** 计数 */
const watch = (tplFile: string, AdressHtml: string) => {
  /* 已监听 */
  if (watcher[tplFile] && watcher[AdressHtml]) return
  watcher[tplFile] = chokidar.watch(tplFile).on('change', () => {
    delete html[tplFile]
    console.log(yellow('[updata][models][html]'), tplFile)
  })
  watcher[AdressHtml] = chokidar.watch(AdressHtml).on('change', () => {
    console.log(yellow('[updata][models][html]'), AdressHtml)
  })
}

export const screenshot = async (name: string, data = {}) => {
  let { tplFile, AppName = name, saveId = name }: any = data
  /* 生成后的html地址 */
  const AdressHtml = `${process.cwd()}/data/${AppName}/html/${name}/${saveId}.html`
  /*生成后的png地址 */
  const AdressImg = `${process.cwd()}/data/${AppName}/html/${name}/${saveId}.png`
  if (!html[tplFile]) {
    /** 读取html模板 */
    ctrateFilePath(`/data/${AppName}/html/${name}`, process.cwd())
    try {
      html[tplFile] = fs.readFileSync(tplFile, 'utf8')
    } catch (error) {
      console.log(red('[err][models][html]'), tplFile)
      /* 生成失败 */
      return false
    }
    /*监控*/
    watch(tplFile, AdressHtml)
  }
  /*将模板源代码编译成htmldata*/
  let tmpHtml = template.render(html[tplFile], data)
  /* 写入 */
  fs.writeFileSync(AdressHtml, tmpHtml)
  /* 写入成功 */
  console.log(green('[ctreate][models][html]'), AdressHtml)
  /* 截图 */
  await getImg(AdressHtml, 'body', AdressImg)
  .catch((err:any)=>console.log(red(err)))
  /* 返回图片地址 */
  return AdressImg
}
