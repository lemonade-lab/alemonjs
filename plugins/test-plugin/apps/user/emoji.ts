import { plugin, PluginType, Messgetype } from '../../api'

export class emoji extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '表态示范',
      rule: [
        {
          reg: '^/你得意什么$',
          fnc: 'onrecall'
        }
      ]
    })
  }

  async onrecall(e: Messgetype) {
    e.postEmoji({
      message_id: e.msg.id,
      emoji_type: 1,
      emoji_id: '4'
    })
    return false
  }
}
