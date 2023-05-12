import { plugin, PluginType, Messgetype } from '../../api'

export class urlimg extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '开发简单示例演示',
      rule: [
        {
          reg: '^/原神黄历$',
          fnc: 'getAlmanac'
        }
      ]
    })
  }

  /**
   * 指令方法
   * @param e 消息对象
   * @returns
   */
  async getAlmanac(e: Messgetype) {
    /* 消息发送机制 */
    e.reply(segment.image('https://api.xingzhige.com/API/yshl/'))
    return false
  }
}
