import { BOTCONFIG } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
import { createClient, getIntentsMask } from './sdk/index.js'
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
  // 读取配置
  const cfg = BOTCONFIG.get('ntqq')
  const intents = getIntentsMask(cfg.intents)
  // 创建客户端
  await createClient(
    {
      appID: cfg.appID,
      token: cfg.token,
      secret: cfg.secret,
      intents: intents,
      isPrivate: cfg.isPrivate,
      sandbox: cfg.sandbox,
      shard: cfg?.shard ?? [0, 1]
    },
    conversation
  )
}
// 客户端
export { ClientNTQQ } from './sdk/index.js'
