import { AlemonOptions } from './types.js'
import { RebotMap } from './map.js'
import {
  ALunchConfig,
  AppLoadConfig,
  IP,
  APPS,
  loadError
} from '../core/index.js'
import { ABotConfig } from '../config/index.js'
import { createWeb } from '../koa/index.js'
import { ClientKOA } from '../koa/file.js'
import { join } from 'path'
import { AControllers } from '../api/index.js'
/**
 * 启动器
 * @param Options
 */
export async function runAlemon(Options?: AlemonOptions) {
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
    IP.get()
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
        loadError('local dev', err)
      })
    }
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
   * ************
   * 开始解析
   * ************
   */
  if (Options?.mount !== false) APPS.init()
  /**
   * ********
   * 登录提示
   * ********
   */
  if (!Options?.login || Object.keys(Options?.login ?? {}).length == 0) {
    console.info('login no bot')
    return
  }
  /**
   * 登录第三方机器人
   */
  if (Options?.platforms) {
    for (const item in Options.login) {
      // 非内置机器人
      if (!['qq', 'villa', 'discord', 'kook', 'ntqq'].find(i => i == item)) {
        const back = Options.platforms.find(i => i.name == item)
        if (!back) continue
        // 登录
        back.login(
          Options.login[back.name],
          APPS.responseMessage,
          APPS.responseEventType
        )
        // 设置控制器
        AControllers.set(back.name, back.controllers)
      }
    }
  }
  // 防止重复登录
  const arr: string[] = []
  /**
   * 登录机器人
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
 * 配置机器人启动规则
 * @param Options
 */
export async function defineAlemonConfig(Options?: AlemonOptions) {
  /**
   * ************
   * ************
   * 配置信息载入
   * ************
   * ************
   */
  if (Options?.puppeteer) {
    for (const item in Options.puppeteer) {
      ALunchConfig.set(item as any, Options.puppeteer[item])
    }
  }
  /**
   * ********
   * email
   * ********
   */
  if (Options.email) {
    ABotConfig.set('email', Options.email)
  }
  /**
   * *********
   * mysql配置
   * *********
   */
  if (Options?.mysql) {
    ABotConfig.set('mysql', Options.mysql)
  }
  /**
   * *********
   * redis配置
   * *********
   */
  if (Options?.redis) {
    ABotConfig.set('redis', Options.redis)
  }
  /**
   * *********
   * serer配置
   * *********
   */
  if (Options?.server) {
    ABotConfig.set('server', Options.server)
  }
  /**
   * ************
   * 设置加载目录
   * ************
   */
  if (Options?.plugin?.directory) {
    AppLoadConfig.set('dir', Options?.plugin?.directory)
  }
  if (Options?.plugin?.main) {
    AppLoadConfig.set('main', Options?.plugin?.main)
  }
  if (Options?.plugin?.type) {
    AppLoadConfig.set('type', Options?.plugin?.type)
  }
  /**
   * ************
   * 设置扫描规则
   * ***********
   */
  if (Options?.plugin?.RegexOpen) {
    AppLoadConfig.set('openRegex', Options?.plugin?.RegexOpen)
  }
  if (Options?.plugin?.RegexClose) {
    AppLoadConfig.set('closeRegex', Options?.plugin?.RegexClose)
  }
  /**
   * 设置事件忽略规则
   */
  const shieldEvent = Options?.shieldEvent ?? []
  if (
    shieldEvent &&
    Array.isArray(Options.shieldEvent) &&
    shieldEvent.every((item: any) => typeof item === 'string')
  ) {
    AppLoadConfig.set('event', shieldEvent)
  }
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
      ABotConfig.set('ntqq', Options.login.ntqq)
    }
    if (Options.login?.kook) {
      // 自定义覆盖
      ABotConfig.set('kook', Options.login.kook)
    }
    if (Options.login?.villa) {
      // 自定义覆盖
      ABotConfig.set('villa', Options.login.villa)
    }
    if (Options.login?.discord) {
      // 自定义覆盖
      ABotConfig.set('discord', Options.login.discord)
    }
    // 开启私域
    if (Options.login?.qq) {
      // 开启私域
      if (Options.login?.qq?.isPrivate) {
        ABotConfig.set('qq', {
          intents: [
            // 基础事件
            'GUILDS', //频道进出
            'MEMBERS', //成员资料
            'DIRECT_MESSAGE', //私信
            'REACTIONS', //表情表态
            // 需申请的
            'AUDIO_ACTION', //音频
            'MESSAGE_AUDIT', //消息审核
            'INTERACTION', //互动事件
            // 私域特有
            'GUILD_MESSAGES', //私域事件
            'FORUMS_EVENT' //私域论坛
          ],
          ...Options.login.qq
        })
      } else {
        ABotConfig.set('qq', Options.login.qq)
      }
    }
  }
  if (Options?.server?.ip) {
    IP.set(Options?.server?.ip)
  }
  /**
   * ************
   * ************
   * 配置信息启动
   * ************
   * ************
   */
  if (process.env.ALEMONJS_RUN != 'dev') {
    await runAlemon(Options)
  }
  return
}
