import { plugin, PluginType, Messgetype } from '../../api'

export class isrecall extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '撤回消息',
      eventType: 'DELETE',
      rule: [
        {
          fnc: 'onrecall'
        }
      ]
    })
  }

  async onrecall(e: Messgetype) {
    if (cfg.sandbox) {
      console.info(e)
      console.info('触发撤回消息')
    }
    return false
  }
}
