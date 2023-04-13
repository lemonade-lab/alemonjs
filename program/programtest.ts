import plugin from '../src/lib/plugins'
import { pluginType, messgetype } from '../src/lib/types'
const apps = {
  yuanshen: class yuanshen extends plugin {
    [parameter: string]: pluginType
    constructor() {
      super({
        /* 说明集*/
        dsc: '集合类',
        /* 指令集 */
        rule: [
          {
            reg: '^/原神黄历$', //正则指令
            fnc: 'gerAlmanac' //函数匹配
          }
        ]
      })
    }
    async gerAlmanac(e: messgetype) {
      /* 不允许私聊 */
      if (e.isGroup) return false
      /* 网上图片url */
      e.reply(`${segment.at(e.msg.author.id)}`, {
        image: 'https://api.xingzhige.com/API/yshl/'
      })
      return true
    }
  }
}
export { apps }
