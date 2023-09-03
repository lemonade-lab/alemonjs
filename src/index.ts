import { cmdInit, setLanchConfig } from 'alemon'
import { getConfig } from './config.js'

/**
 * 读取配置
 */
const { PuppeteerConfig } = getConfig()

/**
 * 设置浏览器配置
 */
setLanchConfig(PuppeteerConfig)

/**
 * 启动机器人
 */
export const createAlemon = {
  qq: async (): Promise<boolean> => {
    const { createAlemonByQQ: qq } = await import('./qq/index.js')
    return qq()
      .then(() => true)
      .catch(err => {
        console.error(err)
        console.info('QQ机器人启动失败~')
        return false
      })
  },
  villa: async (): Promise<boolean> => {
    const { createAlemonByVilla: villa } = await import('./villa/index.js')
    return villa()
      .then(() => true)
      .catch(err => {
        console.error(err)
        console.info('villa机器人启动失败~')
        return false
      })
  },
  kook: async (): Promise<boolean> => {
    const { createAlemonByKOOK: kook } = await import('./kook/index.js')
    return kook()
      .then(() => true)
      .catch(err => {
        console.error(err)
        console.info('KOOK机器人启动失败~')
        return false
      })
  },
  discord: async (): Promise<boolean> => {
    const { createAlemonByDiscord: dc } = await import('./discord/index.js')
    return dc()
      .then(() => true)
      .catch(err => {
        console.error(err)
        console.info('discord机器人启动失败~')
        return false
      })
  },
  qqgroup: async (): Promise<boolean> => {
    const { createAlemonQQByQQGroup: qqgroup } = await import('./qqgroup/index.js')
    return qqgroup()
      .then(() => true)
      .catch(err => {
        console.error(err)
        console.info('QQ群机器人启动失败~')
        return false
      })
  },
  alemon: cmdInit
}
