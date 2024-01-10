import { BOTCONFIG } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import { Client } from './sdk/index.js'
export async function createAlemon() {
  const ntqq = BOTCONFIG.get('ntqq')
  if (
    (ntqq ?? '') !== '' &&
    (ntqq.appID ?? '') !== '' &&
    (ntqq.token ?? '') !== '' &&
    (ntqq.secret ?? '') !== ''
  ) {
    BOTCONFIG.set('ntqq', ntqq)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'NTQQ ERR')
    return
  }
  const c = new Client()
  c.set(ntqq)
  c.connect(conversation)
}
// 客户端
export { ClientNTQQ } from './sdk/index.js'
