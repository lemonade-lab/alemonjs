import { plugin, pluginType, messgetype } from '../../api'
export class test extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      /* 说明集*/
      describe: '测试类',
      /* 指令集 */
      rule: [
        {
          reg: '^/回答我$', //正则指令
          fnc: 'ontart' //函数匹配10
        },
        {
          reg: '^/艾特我$', //正则指令
          fnc: 'atme' //函数匹配
        },
        {
          reg: '^/私聊我$',
          fnc: 'isGroupp'
        }
      ]
    })
  }

  async ontart(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    /* 框架封装好的消息发送机制 */
    e.reply(`欢迎道友~`)
    return true
  }

  async atme(e: messgetype) {
    /* 判断是否是私聊 */
    if (e.isGroup) return false
    e.reply(`${segment.at(e.msg.author.id)}`)
  }

  async isGroupp(e: messgetype) {
    /* 不允许私聊 */
    if (e.isGroup) return false
    /* 频道转私聊 */
     super.reply(e, '私聊你了哟')
  }
}
