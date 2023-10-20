import PupOptions from '../default/pup.js'
import { AlemonOptions } from './types.js'
import { rebotMap } from './map.js'
import { nodeScripts } from './child_process.js'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { ClientAPIByQQ as ClientByNTQQ } from '../ntqq/sdk/index.js'
import { command } from './command.js'
import {
  createApp,
  setLanchConfig,
  loadInit,
  appsInit,
  setAppProCoinfg,
  startChrom
} from '../core/index.js'
import {
  getPupPath,
  setBotConfigByKey,
  getBotConfigByKey
} from '../config/index.js'

// 设置ntqq独立鉴权路径
export const setAuthenticationByNtqq = ClientByNTQQ.setAuthentication

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
  setBotConfigByKey('puppeteer', pCig)
  if (Options?.puppeteer) {
    setBotConfigByKey('puppeteer', Options?.puppeteer)
  }
  const pData = getBotConfigByKey('puppeteer')
  await setLanchConfig(pData)

  /**
   * *********
   * pup启动
   * ********
   */
  if (Options.pupStart !== false) {
    await startChrom()
  }
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
   * 登录机器人
   * *********
   */
  if (
    Options?.login &&
    (Options?.plugin?.init !== false || Options?.app?.init !== false)
  ) {
    if (Options.login?.discord) {
      setBotConfigByKey('discord', Options.login.discord)
    }
    if (Options.login?.qq) {
      // 开启私域
      if (Options.login?.qq?.isPrivate) {
        setBotConfigByKey('qq', {
          intents: [
            // 基础事件
            AvailableIntentsEventsEnum.GUILDS, //频道进出
            AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
            AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
            // 需申请的
            AvailableIntentsEventsEnum.AUDIO_ACTION, //音频
            AvailableIntentsEventsEnum.MESSAGE_AUDIT, //消息审核
            AvailableIntentsEventsEnum.INTERACTION, //互动事件
            AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, //表情表态
            // 私域特有
            AvailableIntentsEventsEnum.GUILD_MESSAGES, //私域事件
            AvailableIntentsEventsEnum.FORUMS_EVENT //私域论坛
          ]
        })
      } else {
        setBotConfigByKey('qq', {
          intents: [
            // 基础事件
            AvailableIntentsEventsEnum.GUILDS, //频道进出
            AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
            AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
            // 公域特有
            AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES //公域事件
          ]
        })
      }
      // 自定义覆盖
      setBotConfigByKey('qq', Options.login.qq)
    }
    if (Options.login?.ntqq) {
      // 自定义覆盖
      setBotConfigByKey('ntqq', Options.login.ntqq)
    }
    if (Options.login?.kook) {
      // 自定义覆盖
      setBotConfigByKey('kook', Options.login.kook)
    }
    if (Options.login?.villa) {
      // 自定义覆盖
      setBotConfigByKey('villa', Options.login.villa)
    }
    for (const item in Options.login) {
      if (arr.indexOf(item) != -1) continue
      if (!rebotMap[item]) continue
      arr.push(item)
      await rebotMap[item]()
    }
  }

  /**
   * ********
   * 登录提示
   * ********
   */
  if (!Options?.login || Object.keys(Options?.login ?? {}).length == 0) {
    console.info('[LOGIN] 无登录配置')
  }

  /**
   * ***********
   * 加载应用
   * ************
   */
  if (Options?.login && Options?.app?.init !== false) {
    const app = createApp(Options?.app?.name ?? 'bot')
    if (Options?.app?.regJSon?.create === false) {
      setAppProCoinfg('regex', Options?.app?.regJSon?.create)
    }
    if (Options?.app?.regJSon?.address) {
      setAppProCoinfg('route', Options?.app?.regJSon?.address)
    }
    if (Options?.app?.component) {
      for await (const item of Options.app.component) {
        app.component(item)
      }
    }
    app.mount()
  }

  /**
   * ************
   * 设置加载目录
   * ************
   */
  if (Options?.plugin?.directory) {
    setAppProCoinfg('dir', Options?.plugin?.directory)
  }
  if (Options?.plugin?.main) {
    setAppProCoinfg('main', Options?.plugin?.main)
  }
  if (Options?.plugin?.type) {
    setAppProCoinfg('type', Options?.plugin?.type)
  }

  /**
   * ************
   * 设置扫描规则
   * ***********
   */
  if (Options?.plugin?.RegexOpen) {
    setAppProCoinfg('openRegex', Options?.plugin?.RegexOpen)
  }
  if (Options?.plugin?.RegexClose) {
    setAppProCoinfg('closeRegex', Options?.plugin?.RegexClose)
  }

  /**
   * ************
   * 扫描插件
   * ************
   */
  if (Options?.login && Options?.plugin?.init !== false) {
    // 加载插件
    await loadInit()
  }

  /**
   * ************
   * 开始解析
   * ************
   */
  if (Options?.mount !== false) {
    await appsInit()
  }
  /**
   * 延迟执行
   */
  setTimeout(async () => {
    /**
     * **********
     * 附加执行
     * **********
     */
    if (Options?.command) {
      for await (const item of Options.command) {
        if (item?.cmd) {
          // 默认同步
          await command(item?.cess ?? 'execSync', item?.cmd)
        }
      }
    }
    /**
     * **********
     * 附加脚本
     * **********
     */
    if (Options?.scripts) {
      for await (const item of Options.scripts) {
        const name = item?.name ?? 'node'
        nodeScripts(name, item?.file, item?.ars ?? [])
      }
    }
  }, Options?.waitingTime ?? Object.keys(Options?.login ?? {}).length * 1000)
  return
}
