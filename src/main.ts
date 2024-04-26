import { join } from 'path'
import { configDotenv } from 'dotenv'
import {
  ALunchConfig,
  AppLoadConfig,
  IP,
  APPS,
  readScript,
  AppServerConfig
} from './core/index.js'
import { ABotConfig } from './config/index.js'
import { AlemonOptions, LoginMap, analysis } from './define/index.js'
import { DrawingBed, FileOptions, config } from './file/index.js'
import { AControllers } from './api/index.js'
import { existsSync } from 'fs'
import { loger } from './log.js'

import * as RebotMap from './platform/index.js'

/**
 * 启动器
 * @param Options
 */
export function runAlemon(Options?: AlemonOptions) {
  /**
   * *********
   * dov
   * ********
   */
  configDotenv(Options.env)

  const promise = []

  /**
   * ***********
   * 加载应用
   * ************
   */
  if (Options?.login && Options?.app?.init !== false) {
    if (Options?.app?.scripts && typeof Options?.app?.scripts == 'string') {
      const dir = join(process.cwd(), Options?.app?.scripts)
      // 如果是ts，而且存在
      if (existsSync(dir)) {
        promise.push(readScript(dir))
      } else {
        let directory = dir
        if (dir.endsWith('ts')) {
          directory = directory.replace(/\.ts$/, '.js')
        } else if (dir.endsWith('js')) {
          directory = directory.replace(/\.js$/, '.ts')
        }
        if (existsSync(directory)) {
          promise.push(readScript(directory))
        }
      }
    }
  }
  /**
   * ************
   * 扫描插件
   * ************
   */
  if (Options?.login && Options?.plugin?.init !== false) {
    // 加载插件
    promise.push(APPS.load())
  }

  // 推送加载
  Promise.all(promise)
    .then(async () => {
      /**
       * ************
       * 开始解析
       * ************
       */
      if (Options?.mount !== false) {
        APPS.init()
      }
    })
    .catch(loger.error)

  /**
   * ********
   * 登录提示
   * ********
   */
  if (!Options?.login || Object.keys(Options?.login ?? {}).length == 0) {
    loger.info('[LOGIN] Not Config')
    return
  }

  const promises = []

  /**
   * 登录第三方机器人
   */
  if (Options?.platforms) {
    for (const item in Options.login) {
      // 非内置机器人
      if (!['qq', 'discord', 'kook', 'ntqq'].find(i => i == item)) {
        const back = Options.platforms.find(i => i.name == item)
        if (!back) continue
        promises.push(
          new Promise((resolve, reject) => {
            try {
              back.login(Options.login[back.name])
              resolve(true)
            } catch (e) {
              reject(e)
            }
          })
        )
        // 设置控制器
        AControllers.set(back.name, back.controllers)
      }
    }
  }

  /**
   * 登录机器人
   */
  for (const item in Options.login) {
    if (!RebotMap[item]) continue
    // 登录执行
    promise.push(RebotMap[item]())
  }

  // 并发登录
  Promise.all(promises).catch(loger.error)
}

/**
 *
 * @param Options
 */
export function ALoginOptions<T>(Options?: LoginMap & T) {
  return analysis(Options) ?? {}
}

/**
 * 配置机器人启动规则
 * @param Options
 */
export async function defineConfig<T>(Options?: AlemonOptions & T) {
  if (!Options.env) {
    Options.env = {}
  }
  if (!Options.env?.path) {
    Options.env.path = 'alemon.env'
  }
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
   * 图片存储
   * ********
   */
  if (Options?.imageStorage) {
    DrawingBed.set('func', Options.imageStorage)
    DrawingBed.set('state', true)
  }
  /***
   * server
   */
  if (Options.server?.port) {
    AppServerConfig.set('port', Options.server.port)
  }
  if (Options.server?.middleware) {
    AppServerConfig.set('middleware', Options.server.middleware)
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
   * file配置
   * *********
   */
  if (Options?.file) {
    ABotConfig.set('file', Options.file)
  }
  if (Options?.file?.ip) {
    IP.set(Options?.file?.ip)
  }
  /**
   * ************
   * 设置加载目录 | 设置扫描规则
   * ************
   */
  if (Options?.plugin) {
    for (const key in Options.plugin) {
      if (AppLoadConfig.has(key)) {
        AppLoadConfig.set(key as any, Options.plugin[key])
      }
    }
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
   * 检查login文件是否存在
   */
  const lg_ts = join(process.cwd(), 'alemon.login.ts')
  const lg_js = join(process.cwd(), 'alemon.login.js')
  if (Options.loginDir) {
    Options.login = (
      await readScript(join(process.cwd(), Options.loginDir))
    )?.default
  } else if (existsSync(lg_ts)) {
    Options.login = (await readScript(lg_ts))?.default
  } else if (existsSync(lg_js)) {
    Options.login = (await readScript(lg_js))?.default
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

  /**
   * ***********
   * file配置
   * **********
   */
  if (Options?.server) {
    for (const item in Options?.server) {
      config.set(item as keyof FileOptions, Options?.server[item])
    }
  }

  /**
   * ************
   * ************
   * 配置信息启动
   * ************
   * ************
   */
  if (process.env.ALEMONJS_RUN != 'dev') {
    runAlemon(Options)
  }
  return Options
}
