import { plugin, PluginType, Messgetype } from '../../api'
export class testcmd extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      /* 指令集 */
      dsc: 'JS编写的插件指令',
      rule: [
        {
          reg: '^/鸡你太美$', //正则指令
          fnc: 'ontest' //函数匹配10
        },
        {
          reg: '^/来个按钮$', //正则指令
          fnc: 'getButton' //函数匹配10
        },
        {
          reg: '^/泰裤辣$', //正则指令
          fnc: 'getCool' //函数匹配10
        }
      ]
    })
  }

  async ontest(e: Messgetype) {
    /* 封装好的消息发送机制 */
    e.reply(`😂 你干嘛,哎哟~`, segment.reply(e.msg.id))
    return false
  }

  async getButton(e: Messgetype) {
    const arr = [
      {
        desc: '哎呦', //按钮文本
        link: 'https://www.baidu.com/' //按钮链接
      }
    ]
    //按钮模板需要申请
    e.reply(segment.button(arr))
    return false
  }

  async getCool(e: Messgetype) {
    e.reply(
      segment.embed(
        '新人任务',
        '一库一库',
        'http://tva1.sinaimg.cn/bmiddle/6af89bc8gw1f8ub7pm00oj202k022t8i.jpg',
        ['一库一库', '一库一库']
      )
    )
    return false
  }
}
