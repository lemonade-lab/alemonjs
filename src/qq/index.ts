import { Client } from './sdk/index.js'
import { BOTCONFIG } from '../config/index.js'
import { Conversation } from './alemon/conversation.js'
export async function createAlemon() {
  const qq = BOTCONFIG.get('qq')
  if ((qq ?? '') !== '' && (qq.appID ?? '') !== '' && (qq.token ?? '') !== '') {
    BOTCONFIG.set('qq', qq)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'QQ ERR')
    return
  }
  const c = new Client()
  c.set(qq)
  c.connect(Conversation)
}
// 客户端
export { ClientQQ } from './sdk/index.js'
