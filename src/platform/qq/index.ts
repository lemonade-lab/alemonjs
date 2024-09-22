import { Client } from './sdk/index.js'
import { ABotConfig } from '../../config/index.js'
import { Conversation } from './alemon/conversation.js'
import { loger } from '../../log.js'
export function createQQ() {
  const qq = ABotConfig.get('qq')
  if ((qq ?? '') !== '' && (qq.appID ?? '') !== '' && (qq.token ?? '') !== '') {
    ABotConfig.set('qq', qq)
  } else {
    loger.error('[LOGIN]', '-----------------------')
    loger.error('[LOGIN]', 'QQ ERR')
    return
  }
  new Client().set(qq).connect(Conversation)
}
// 客户端
export { ClientQQ } from './sdk/index.js'
