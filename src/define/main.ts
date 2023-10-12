import { compilationTools } from 'alemon-rollup'
import PupOptions from '../default/pup.js'
import { AlemonOptions } from '../default/types.js'
import { rebotMap } from './map.js'
import { nodeScripts } from './child_process.js'
import { ClientAPIByQQ as ClientByNTQQ } from '../ntqq/sdk/index.js'
import {
  createApp,
  loadInit,
  setBotConfigByKey,
  setLanchConfig,
  getPupPath,
  getBotConfigByKey
} from '../index.js'

// 设置ntqq独立鉴权路径
export const setAuthenticationByNtqq = ClientByNTQQ.setAuthentication

let appDir = 'application'

/**
 * 应用模块集成
 * @param AppName
 * @param name
 * @returns
 */
export function ApplicationTools(AppName: string, name = 'apps') {
  return compilationTools({
    aInput: `${appDir}/${AppName}/${name}/**/*.ts`,
    aOutput: `${appDir}/${AppName}/apps.js`
  })
}

/**
 * 机器人配置
 * @param Options
 */
export async function defineAlemonConfig(Options: AlemonOptions) {
  /**
   * *******
   * pup配置
   * *******
   */
  const pCig = { ...PupOptions, ...getPupPath() }
  // 设置旧的值
  setBotConfigByKey('puppeteer', pCig)
  if (Options?.puppeteer) {
    // 存在 替换新的值
    setBotConfigByKey('puppeteer', Options?.puppeteer)
  }
  const pData = getBotConfigByKey('puppeteer')
  await setLanchConfig(pData)
  /**
   * *********
   * mysql配置
   * *********
   */
  if (Options?.mysql) {
    setBotConfigByKey('mysql', Options.mysql)
  }
  /**
   * *********
   * redis配置
   * *********
   */
  if (Options?.redis) {
    setBotConfigByKey('redis', Options.redis)
  }
  /**
   * *********
   * serer配置
   * *********
   */
  if (Options?.server) {
    setBotConfigByKey('server', Options.server)
  }
  /**
   * **********
   * 启动转换器
   * **********
   */
  const arr: string[] = []
  /**
   * *********
   * 启动机器人
   * *********
   */
  if (Options?.login) {
    /**
     * ********
     * 配置载入
     * *******
     */
    if (Options.login?.discord) {
      setBotConfigByKey('discord', Options.login.discord)
    }
    if (Options.login?.qq) {
      setBotConfigByKey('qq', Options.login.qq)
    }
    if (Options.login?.ntqq) {
      setBotConfigByKey('ntqq', Options.login.ntqq)
    }
    if (Options.login?.kook) {
      setBotConfigByKey('kook', Options.login.kook)
    }
    if (Options.login?.villa) {
      setBotConfigByKey('villa', Options.login.villa)
    }
    for (const item in Options.login) {
      if (arr.indexOf(item) != -1) continue
      if (!rebotMap[item]) continue
      arr.push(item)
      await rebotMap[item]()
    }
  } else {
    console.log('[LOGIN] 无登录配置')
  }
  /**
   * ************
   * 迟缓插件加载
   * ************
   */
  let mount = false
  if (Options?.component || Options?.module) {
    mount = true
  }
  const address = Options?.other?.plugin?.directory ?? 'application'
  appDir = address
  /**
   * ************
   * 扫描插件
   * ************
   */
  await loadInit({
    mount: mount,
    address: address == undefined ? '/application' : `/${address}`
  })
  /**
   * ************
   * 编译独立插件
   * ************
   */
  if (mount) {
    const app = createApp(Options?.name ?? 'bot')
    if (Options?.module) {
      const word = await compilationTools(Options.module)
      app.component(word)
    }
    if (Options?.component) {
      for (const item of Options.component) {
        app.component(item)
      }
    }
    app.mount('#app')
  }
  /**
   * ***************
   * 如果是开发模式
   * 不会执行附加脚本
   * ***************
   */
  const ars = process.argv.slice(2)
  if (!ars.includes('off')) {
    /**
     * 执行附加脚本
     */
    if (Options?.scripts) {
      for (const item of Options.scripts) {
        const name = item?.name ?? 'node'
        nodeScripts(name, item?.file, item?.ars ?? [])
      }
    }
  }
  return
}
