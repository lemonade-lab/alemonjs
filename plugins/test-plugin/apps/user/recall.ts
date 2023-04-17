import { plugin, pluginType } from '../../api'

export class recall extends plugin {
  [parameter: string]: pluginType
  constructor() {
    super({
      dsc: '撤回消息',
      eventType: 'MESSAGE_DELETE',
      rule: [
        {
          reg: 'isRecall',
          fnc: 'onrecall'
        }
      ]
    })
  }
  
  async onrecall(e: any) {
    /* 该功能可用于记录所有撤回消息并存到本地 */
    /* 注意e消息选择any类型以确保正确运行 */
    console.log('MESSAGE_DELETE')
    return false
  }
}
