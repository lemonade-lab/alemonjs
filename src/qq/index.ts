import { config, createClient } from './sdk/index.js'
import { BOTCONFIG } from '../config/index.js'
export async function createAlemon() {
  /**
   * 登录
   */
  const qq = BOTCONFIG.get('qq')
  if ((qq ?? '') !== '' && (qq.appID ?? '') !== '' && (qq.token ?? '') !== '') {
    BOTCONFIG.set('qq', qq)
  } else {
    console.error('[LOGIN]', '-----------------------')
    console.error('[LOGIN]', 'QQ ERR')
    return
  }
  /**
   * 读取配置
   */
  const cfg = BOTCONFIG.get('qq')
  /**
   * **********
   * sdk-config
   * **********
   */
  config.set('appID', cfg.appID)
  config.set('token', cfg.token)
  config.set('intents', cfg.intents)
  config.set('sandbox', cfg.sandbox)
  /**
   * *********
   * *********
   */
  createClient((t, d) => {
    console.log('t', t)
    console.log('d', d)
  })
}
// 客户端
export { ClientQQ } from './sdk/index.js'
