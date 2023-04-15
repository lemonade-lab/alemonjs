import { plugin } from '../../api'
export class jsdemo extends plugin {
  constructor() {
    super({
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
    /* 框架封装好的消息发送机制 */
    e.reply(`你触发了由JS编写的插件指令~`)
    return true
  }
}
