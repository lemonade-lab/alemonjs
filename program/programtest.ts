import plugin from '../src/lib/plugins'
import { pluginType, messgetype } from '../src/lib/types'
const apps = {
  newok: class newok extends plugin {
    [parameter: string]: pluginType
    constructor() {
      super({
        /* 说明集*/
        describe: '集合类',
        /* 指令集 */
        rule: [
          {
            reg: '^/集合测试$', //正则指令
            fnc: 'test' //函数匹配
          },
          {
            reg: '^/集合例子$', //正则指令
            fnc: 'restart' //函数匹配
          }
        ]
      })
    }
    async test(e: messgetype) {
      /* 不允许私聊 */
      if (e.isGroup) return false
      e.reply('我收到了例子')
      return true
    }
    async restart(e: messgetype) {
      /* 不允许私聊 */
      if (e.isGroup) return false
      e.reply(`我收到了例子`)
      return true
    }
  }
}
export { apps }
