import { AlemonOptions } from './types.js'
import { rebotMap } from './map.js'
import { nodeScripts } from './child_process.js'
import { IntentsEnum } from '../ntqq/sdk/index.js'
import { command } from './command.js'
import { AppNameError } from '../log/index.js'
import {
  Screenshot,
  loadInit,
  appsInit,
  APPCONFIG,
  getPublicIP,
  setPublicIP,
  InstructionMatching,
  InstructionMatchingByNotMessage
} from '../core/index.js'
import { getPupPath, BOTCONFIG } from '../config/index.js'
import { createWeb } from '../koa/index.js'
import { autoClearFiles } from '../koa/file.js'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { join } from 'path'
import { setControlller } from '../api/controller.js'

let OptionsCache: AlemonOptions

/**
 * 得到初始化配置
 * @returns
 */
export function getAlemonConfig() {
  return OptionsCache
}

/**
 * 配置机器人启动规则
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
  const pCig = { ...Screenshot.launch, ...getPupPath() }
  BOTCONFIG.set('puppeteer', pCig)
  if (Options?.puppeteer) {
    BOTCONFIG.set('puppeteer', Options?.puppeteer)
  }
  const pData = BOTCONFIG.get('puppeteer')
  Screenshot.setLaunch(pData)
  /**
   * *********
   * pup启动
   * ********
   */
  if (Options.pupStart !== false) {
    await Screenshot.start()
  }
  /**
   * *********
   * mysql配置
   * *********
   */
  if (Options?.mysql) {
    BOTCONFIG.set('mysql', Options.mysql)
  }
  /**
   * *********
   * redis配置
   * *********
   */
  if (Options?.redis) {
    BOTCONFIG.set('redis', Options.redis)
  }
  /**
   * *********
   * serer配置
   * *********
   */
  if (Options?.server) {
    BOTCONFIG.set('server', Options.server)
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
    // 开启私域
    if (Options.login?.qq) {
      // 开启私域
      if (Options.login?.qq?.isPrivate) {
        BOTCONFIG.set('qq', {
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
          ],
          ...Options.login.qq
        })
      } else {
        BOTCONFIG.set('qq', {
          intents: [
            // 基础事件
            AvailableIntentsEventsEnum.GUILDS, //频道进出
            AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
            AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
            // 公域特有
            AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES //公域事件
          ],
          ...Options.login.qq
        })
      }
    }

    if (Options.login?.ntqq) {
      /**
       * 根据模式来选择
       */
      const intents: IntentsEnum[] = []

      const c = BOTCONFIG.get('ntqq')

      if (!Options.login.ntqq.mode) {
        Options.login.ntqq.mode = c.mode
      }

      if (Options.login.ntqq.mode == 'qq') {
        // 全部都要推
        intents.push('GUILDS') //频道进出
        intents.push('GUILD_MEMBERS') //成员资料
        intents.push('DIRECT_MESSAGE') //私信
        if (Options.login?.qq?.isPrivate == true) {
          intents.push('AUDIO_ACTION')
          intents.push('MESSAGE_AUDIT')
          intents.push('INTERACTION')
          intents.push('INTERACTION')
          intents.push('GUILD_MESSAGES')
          intents.push('FORUMS_EVENT')
        } else {
          intents.push('PUBLIC_GUILD_MESSAGES')
        }
        intents.push('GROUP_AT_MESSAGE_CREATE') //频道进出
        intents.push('C2C_MESSAGE_CREATE') //成员资料
      } else if (Options.login.ntqq.mode == 'qq-group') {
        intents.push('GROUP_AT_MESSAGE_CREATE') //频道进出
        intents.push('C2C_MESSAGE_CREATE') //成员资料
      } else if (Options.login.ntqq.mode == 'qq-guild') {
        // 默认是 qq-guild
        intents.push('GUILDS') //频道进出
        intents.push('GUILD_MEMBERS') //成员资料
        intents.push('DIRECT_MESSAGE') //私信
        // 公的私的
        if (Options.login?.qq?.isPrivate == true) {
          intents.push('AUDIO_ACTION')
          intents.push('MESSAGE_AUDIT')
          intents.push('INTERACTION')
          intents.push('INTERACTION')
          intents.push('GUILD_MESSAGES')
          intents.push('FORUMS_EVENT')
        } else {
          intents.push('PUBLIC_GUILD_MESSAGES')
        }
      }

      // 自定义覆盖
      BOTCONFIG.set('ntqq', {
        ...{ intents },
        ...Options.login.ntqq
      })
    }
    if (Options.login?.kook) {
      // 自定义覆盖
      BOTCONFIG.set('kook', Options.login.kook)
    }
    if (Options.login?.villa) {
      // 自定义覆盖
      BOTCONFIG.set('villa', Options.login.villa)
    }
    if (Options.login?.discord) {
      // 自定义覆盖
      BOTCONFIG.set('discord', Options.login.discord)
    }

    /**
     * 登录执行
     */
    if (Options?.platforms) {
      for (const item in Options.login) {
        // 非内置机器人
        if (!['qq', 'villa', 'discord', 'kook', 'ntqq'].find(i => i == item)) {
          const back = Options.platforms.find(i => i.name == item)
          // 存在login  但不存在插件
          if (!back) continue
          // 登录
          const app = back.login(
            Options.login[back.name],
            InstructionMatching,
            InstructionMatchingByNotMessage
          )
          // 存入控制器
          setControlller(back.name, app.controller)
        }
      }
    }

    /**
     * 内部登录执行
     */
    for (const item in Options.login) {
      if (arr.indexOf(item) != -1) continue
      if (!rebotMap[item]) continue
      arr.push(item)
      // 登录执行
      await rebotMap[item]()
    }
  }

  /**
   * ********
   * 登录提示
   * ********
   */
  if (!Options?.login || Object.keys(Options?.login ?? {}).length == 0) {
    console.info('login no bot')
  }

  /**
   * ***********
   * 挂起web服务
   * **********
   */
  if (Options?.server?.state) {
    // 创建server端
    createWeb(Options?.server)
    if (Options?.server?.clear != false) {
      // 定时清除
      autoClearFiles()
    }
    if (Options?.server?.ip) {
      setPublicIP(Options?.server?.ip)
    } else {
      getPublicIP()
    }
  }

  // jsonCreate
  if (Options?.JSON?.init === false) {
    APPCONFIG.set('regex', Options?.JSON.init)
  }

  // json地址
  if (Options?.JSON?.address) {
    APPCONFIG.set('route', Options?.JSON?.address)
  }

  /**
   * ***********
   * 加载应用
   * ************
   */
  if (Options?.login && Options?.app?.init !== false) {
    if (Options?.app?.scripts && typeof Options?.app?.scripts == 'string') {
      const dir = join(process.cwd(), Options?.app?.scripts)
      await import(`file://${dir}`).catch(err => {
        console.error(`file://${dir}`)
        AppNameError('local dev', err)
      })
    }
  }

  /**
   * ************
   * 设置加载目录
   * ************
   */
  if (Options?.plugin?.directory) {
    APPCONFIG.set('dir', Options?.plugin?.directory)
  }
  if (Options?.plugin?.main) {
    APPCONFIG.set('main', Options?.plugin?.main)
  }
  if (Options?.plugin?.type) {
    APPCONFIG.set('type', Options?.plugin?.type)
  }

  /**
   * ************
   * 设置扫描规则
   * ***********
   */
  if (Options?.plugin?.RegexOpen) {
    APPCONFIG.set('openRegex', Options?.plugin?.RegexOpen)
  }
  if (Options?.plugin?.RegexClose) {
    APPCONFIG.set('closeRegex', Options?.plugin?.RegexClose)
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
   *
   */
  const shieldEvent = Options?.shieldEvent ?? []
  if (
    shieldEvent &&
    Array.isArray(Options.shieldEvent) &&
    shieldEvent.every((item: any) => typeof item === 'string')
  ) {
    APPCONFIG.set('event', shieldEvent)
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
