import { plugin, obtainingImages, Messgetype, PluginType, config } from '../../api'
import { createQrcode } from '../../api/rebot'
export class show extends plugin {
  [parameter: string]: PluginType
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
        },
        {
          reg: '^/百度一下$',
          fnc: 'baidu'
        }
      ]
    })
  }

  async getHelp(e: Messgetype) {
    const data = config.getConfig('help', 'help')
    const img = await obtainingImages({ path: 'help', name: 'help', data })
    if (img) e.postImage(img)
    /* 返回false已继续匹配其他指令 */
    return false
  }

  async getVersion(e: Messgetype) {
    const data = config.getConfig('version', 'html')
    const img = await obtainingImages({ path: 'version', name: 'version', data })
    if (img) e.postImage(img)
    return false
  }

  async baidu(e: Messgetype) {
    const img = await createQrcode('https://www.baidu.com/')
    if (img) e.postImage(img, '百度一下,你就知道')
    return false
  }
}
