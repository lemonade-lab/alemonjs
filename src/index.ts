import { setLanchConfig } from 'alemon'
import { getBotConfigByKey, setBotConfig } from './login.js'
import { getToml } from './config.js'
import { cmdInit } from 'alemon'
/**
 * 启动机器人
 */
export const createAlemon = {
  qq: async (): Promise<boolean> => {
    const { createAlemonByQQ: qq } = await import('./qq/index.js')
    return qq().catch(err => {
      console.error(err)
      console.info('QQ机器人启动失败~')
      return false
    })
  },
  villa: async (): Promise<boolean> => {
    const { createAlemonByVilla: villa } = await import('./villa/index.js')
    return villa().catch(err => {
      console.error(err)
      console.info('villa机器人启动失败~')
      return false
    })
  },
  kook: async (): Promise<boolean> => {
    const { createAlemonByKOOK: kook } = await import('./kook/index.js')
    return kook().catch(err => {
      console.error(err)
      console.info('KOOK机器人启动失败~')
      return false
    })
  },
  discord: async (): Promise<boolean> => {
    const { createAlemonByDiscord: dc } = await import('./discord/index.js')
    return dc().catch(err => {
      console.error(err)
      console.info('discord机器人启动失败~')
      return false
    })
  },
  qqgroup: async (): Promise<boolean> => {
    const { createAlemonQQByQQGroup: qqgroup } = await import('./qqgroup/index.js')
    return qqgroup().catch(err => {
      console.error(err)
      console.info('QQ群机器人启动失败~')
      return false
    })
  }
}

/**
 * 启动机器人
 * @param args 启动指令
 * @param cfg 配置地址
 */
export async function createBot(args: string[], cfg?: string) {
  /**
   * 加载配置
   */
  await setBotConfig(getToml(cfg))
  /**
   * 设置浏览器配置
   */
  await setLanchConfig(getBotConfigByKey('puppeteer'))
  /**
   * 控制
   */
  const arr: string[] = []
  /**
   * 开始启动
   */
  for await (const item of args) {
    if (arr.indexOf(item) != -1) continue
    if (!createAlemon[item]) continue
    arr.push(item)
    await createAlemon[item]()
  }
  return cmdInit
}

// 机器人配置
export { getBotConfigByKey, setBotConfigByKey } from './login.js'

// 监听退出
process.on('SIGINT', signals => {
  console.log(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
