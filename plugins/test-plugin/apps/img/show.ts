import { plugin, showPuppeteer, messgetype, pluginType, config } from '../../api'
export class show extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      dsc: '发送图片',
      rule: [
        {
          reg: '^/柠檬帮助$',
          fnc: 'alementShowHelp'
        }
      ]
    })
  }
  async alementShowHelp(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    const data = config.getConfig('help', 'help')
    const img = await showPuppeteer({ path: 'help', name: 'help', data })
    e.sendImage('', img)
    return false
  }
}
