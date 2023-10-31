import { createWsHandler } from './sdk/wss.js'
import { checkRobotByOne } from './login.js'
import { getBotConfigByKey } from '../config/index.js'
import { conversation } from './alemon/conversation.js'
export async function createAlemonByONE() {
  // 登录
  if (
    await checkRobotByOne().catch(err => {
      console.error(err)
      return false
    })
  ) {
    const OCFG = getBotConfigByKey('one')
    /**
     * 创建监听
     */
    createWsHandler(
      {
        url: OCFG?.url ?? '',
        access_token: OCFG?.access_token ?? ''
      },
      conversation
    )
    return true
  }
  return false
}
