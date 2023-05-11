import { plugin, PluginType, Messgetype } from '../../api'
export class groupme extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      /* 说明集*/
      dsc: '指令用法示范',
      /* 指令集 */
      rule: [
        {
          reg: '^/私聊我$',
          fnc: 'isGroup'
        }
      ]
    })
  }

  async isGroup(e: Messgetype) {
    /* 公信转私信 */
    super.reply(e, '私聊你了哟')
    return false
  }
}
