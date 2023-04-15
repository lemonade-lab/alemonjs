import { plugin, showPuppeteer, messgetype, pluginType, config } from '../../api'
export class show extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      dsc: '发送图片',
      rule: [
        {
          reg: '^/柠檬帮助.*$',
          fnc: 'getHelp'
        },
        {
          reg: '^/柠檬版本.*$',
          fnc: 'getVersion'
        }
      ]
    })
  }
  async getHelp(e: messgetype) {
    const data = config.getConfig('help', 'help')
    const img = await showPuppeteer({ path: 'help', name: 'help', data })
    e.sendImage('', img)
    return false
  }
  async getVersion(e: messgetype) {
    const data = config.getConfig('version', 'html')
    const img = await showPuppeteer({ path: 'version', name: 'version', data })
    e.sendImage('', img)
    return false
  }
}
