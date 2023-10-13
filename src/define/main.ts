import { compilationTools } from 'alemon-rollup'
import PupOptions from '../default/pup.js'
import { AlemonOptions } from './types.js'
import { rebotMap } from './map.js'
import { nodeScripts } from './child_process.js'
import { ClientAPIByQQ as ClientByNTQQ } from '../ntqq/sdk/index.js'
import {
  createApp,
  loadInit,
  setBotConfigByKey,
  setLanchConfig,
  getPupPath,
  getBotConfigByKey,
  setAppRegex
} from '../index.js'
import { command } from './command.js'

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

let OptionsCache: AlemonOptions

/**
 * 得到载入配置
 * @returns
 */
export function getAlemonConfig() {
  return OptionsCache
}

/**
 * 机器人配置
 * @param Options
 */
export async function defineAlemonConfig(Options?: AlemonOptions) {
  if (!Options) return
  OptionsCache = Options

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
  }

  if (!Options?.login || Object.keys(Options?.login ?? {}).length == 0) {
    console.info('[LOGIN] 无登录配置')
  }

  /**
   * ************
   * 迟缓插件加载
   * ************
   */
  let mount = false
  if (Options?.app?.component || Options?.app?.module) {
    mount = true
  }
  const address = Options?.plugin?.directory ?? 'application'
  appDir = address
  /**
   * ************
   * 设置扫描规则
   * ***********
   */
  if (Options?.plugin?.RegexOpen || Options?.plugin?.RegexClose) {
    setAppRegex({
      RegexOpen: Options?.plugin?.RegexOpen,
      RegexClose: Options?.plugin?.RegexClose
    })
  }
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
    const app = createApp(Options?.app?.name ?? 'bot')
    if (Options?.app?.regJSon?.address) {
      app.setHelp(Options?.app?.regJSon?.address ?? '/public/defset')
    }
    if (Options?.app?.module) {
      const word = await compilationTools({
        aInput: Options?.app?.module?.input ?? 'src/apps/**/*.ts',
        aOutput: Options?.app?.module?.input ?? '.apps/index.js'
      })
      app.component(word)
    }
    if (Options?.app?.component) {
      for await (const item of Options.app.component) {
        app.component(item)
      }
    }
    app.mount('#app')
  }
  /**
   * **********
   * 附加执行
   * **********
   */
  if (Options?.command) {
    for await (const item of Options.command) {
      await command(item)
    }
  }
  /**
   * ***************
   * 附加脚本
   * ***************
   */
  if (Options?.scripts) {
    for await (const item of Options.scripts) {
      const name = item?.name ?? 'node'
      nodeScripts(name, item?.file, item?.ars ?? [])
    }
  }
  return
}
