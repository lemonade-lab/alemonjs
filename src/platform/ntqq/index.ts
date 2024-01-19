import { ABotConfig } from '../../config/index.js'
import { conversation } from './alemon/conversation.js'
import { Client } from './sdk/index.js'
export async function createAlemon() {
  const ntqq = ABotConfig.get('ntqq')
  if (
    (ntqq ?? '') !== '' &&
    (ntqq.appID ?? '') !== '' &&
    (ntqq.token ?? '') !== '' &&
    (ntqq.secret ?? '') !== ''
  ) {
    ABotConfig.set('ntqq', ntqq)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'NTQQ ERR')
    return
  }
  new Client().set(ntqq).connect(conversation)
}
// 客户端
export { ClientNTQQ } from './sdk/index.js'
