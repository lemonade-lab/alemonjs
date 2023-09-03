import { getYaml } from './config.js'
import { watch } from 'fs'
/**
 * 监听登录
 * @param val
 * @param text1
 * @param text2
 */
export function watchLogin(val: string, callBack = () => {}) {
  console.log('[LOGIN] 配置监听启动')
  watch(val, async () => {
    setTimeout(async () => {
      const configA = getYaml(val)
      const configB = callBack()
      if ((configA ?? '') === '' || JSON.stringify(configB) !== JSON.stringify(configA)) {
        console.error('[CONFIG] 配置更改', val)
        process.exit()
      }
    }, 500)
  })
}
