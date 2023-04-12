import { plugin, showPuppeteer, messgetype, pluginType } from '../../api'
export class show extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      describe: '显示类',
      rule: [
        {
          reg: '^/来张图片$',
          fnc: 'showImg'
        }
      ]
    })
  }
  async showImg(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    const img = await showPuppeteer({ path: 'map', name: 'map' })
    e.sendImage('', img)
    return false
  }
}
