import { AlemonOptions } from './types.js'
import { RebotMap } from './map.js'
import { AppNameError } from '../log/index.js'
import { Screenshot, APPCONFIG, IP, APPS } from '../core/index.js'
import { BOTCONFIG } from '../config/index.js'
import { createWeb } from '../koa/index.js'
import { ClientKOA } from '../koa/file.js'
import { join } from 'path'

class AlemonConfig {
  data: AlemonOptions
  get() {
    this.data
  }
  set(val: AlemonOptions) {
    this.data = val
  }
}

export const ALEMONCONFIG = new AlemonConfig()

/**
 * 配置机器人启动规则
 * @param Options
 */
export async function defineAlemonConfig(Options?: AlemonOptions) {
  if (!Options) return
  ALEMONCONFIG.set(Options)
  /**
   * *******
   * pup配置
   * *******
   */
  BOTCONFIG.set('puppeteer', Screenshot.launch)
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
    if (Options.login?.ntqq) {
      // 自定义覆盖
      BOTCONFIG.set('ntqq', Options.login.ntqq)
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

    // 开启私域
    if (Options.login?.qq) {
      // 开启私域
      if (Options.login?.qq?.isPrivate) {
        BOTCONFIG.set('qq', {
          intents: [
            // 基础事件
            'GUILDS', //频道进出
            'GUILD_MEMBERS', //成员资料
            'DIRECT_MESSAGE', //私信
            // 需申请的
            'AUDIO_ACTION', //音频
            'MESSAGE_AUDIT', //消息审核
            'INTERACTION', //互动事件
            'GUILD_MESSAGE_REACTIONS', //表情表态
            // 私域特有
            'GUILD_MESSAGES', //私域事件
            'FORUMS_EVENT' //私域论坛
          ],
          ...Options.login.qq
        })
      } else {
        BOTCONFIG.set('qq', {
          intents: [
            // 基础事件
            'GUILDS', //频道进出
            'GUILD_MEMBERS', //成员资料
            'DIRECT_MESSAGE', //私信
            // 公域特有
            'PUBLIC_GUILD_MESSAGES' //公域事件
          ],
          ...Options.login.qq
        })
      }
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
          back.login(
            Options.login[back.name],
            APPS.responseMessage,
            APPS.responseEventType
          )
        }
      }
    }

    /**
     * 内部登录执行
     */
    for (const item in Options.login) {
      if (arr.indexOf(item) != -1) continue
      if (!RebotMap[item]) continue
      arr.push(item)
      // 登录执行
      await RebotMap[item]()
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
      ClientKOA.autoClearFiles()
    }
    if (Options?.server?.ip) {
      IP.set(Options?.server?.ip)
    } else {
      IP.get()
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
    await APPS.load()
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
  if (Options?.mount !== false) APPS.init()
  return
}
