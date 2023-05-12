import plugin from '../src/lib/plugins'
import { PluginType, Messgetype, EType } from '../src/lib/types'

export class PeopleAdd extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '新人加入',
      event: EType.GUILD_MEMBERS,
      eventType: 'GUILD_MEMBER_ADD',
      rule: [
        {
          fnc: 'peopleAdd'
        }
      ]
    })
  }
  async peopleAdd(e: Messgetype) {
    if (cfg.sandbox) {
      console.log(e)
      console.log('新人加入')
    }
    return false
  }
}

export class PeopleDelete extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '新人更新',
      event: EType.GUILD_MEMBERS,
      eventType: 'GUILD_MEMBER_UPDATE',
      rule: [
        {
          fnc: 'peopleDelete'
        }
      ]
    })
  }
  async peopleDelete(e: Messgetype) {
    if (cfg.sandbox) {
      console.log(e)
      console.log('新人更新')
    }
    return false
  }
}

export class PeopleUpdata extends plugin {
  [parameter: string]: PluginType
  constructor() {
    super({
      dsc: '新人退出',
      event: EType.GUILD_MEMBERS,
      eventType: 'GUILD_MEMBER_REMOVE',
      rule: [
        {
          fnc: 'peopleUpdata'
        }
      ]
    })
  }
  async peopleUpdata(e: Messgetype) {
    if (cfg.sandbox) {
      console.log(e)
      console.log('新人退出')
    }
    return false
  }
}
