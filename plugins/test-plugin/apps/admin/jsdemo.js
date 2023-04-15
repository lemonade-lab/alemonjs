import { plugin } from '../../api'
export class jsdemo extends plugin {
  constructor() {
    super({
      /* 说明集*/
      dsc: '指令用法示范',
      /* 指令集 */
      rule: [
        {
          reg: '^/测试指令$', //正则指令
          fnc: 'ontest' //函数匹配10
        }
      ]
    })
  }

  async ontest(e) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    /* 框架封装好的消息发送机制 */
    e.reply(`你触发了由JS编写的插件指令~`)
    return true
  }
}
