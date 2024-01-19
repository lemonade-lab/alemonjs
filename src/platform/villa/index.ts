import { Client } from './sdk/index.js'
import { ABotConfig } from '../../config/index.js'
import { conversation } from './alemon/conversation.js'
export async function createAlemon() {
  // 登录
  const villa = ABotConfig.get('villa')
  // 存在
  if (
    (villa ?? '') !== '' &&
    (villa.bot_id ?? '') !== '' &&
    (villa.secret ?? '') !== ''
  ) {
    ABotConfig.set('villa', villa)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'VILLA ERR')
    return
  }
  // 创建客户端
  new Client().set(villa).connect(conversation)
}
// 客户端
export { ClientVILLA } from './sdk/index.js'
