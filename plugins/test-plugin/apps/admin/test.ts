import { plugin, pluginType, messgetype } from '../../api'
export class test extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      /* 说明集*/
      dsc: '指令用法示范',
      /* 指令集 */
      rule: [
        {
          reg: '^/私聊我$',
          fnc: 'isGroupp'
        }
      ]
    })
  }

  async isGroupp(e: messgetype) {
    /* 不允许私聊 */
    if (e.isGroup) return false
    /* 频道转私聊 */
    super.reply(e, '私聊你了哟')
  }
}
