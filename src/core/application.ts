import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { orderBy } from 'lodash-es'
import { EVENT, PRIORITY, APP } from './cache.js'
import { type TypingEnum, EventEnum } from './typings.js'
import { APPCONFIG } from './configs.js'
import { APlugin } from './plugin/plugin.js'
import { CALL } from './call.js'
import { APluginInitType } from './plugin/types.js'
import { HELP } from './help.js'

/**
 * **************
 * CommandType
 * **************
 */
export interface CommandType {
  reg: RegExp
  priority: number
  event: (typeof EventEnum)[number]
  typing: (typeof TypingEnum)[number]
  fncName: string
  APP: string
}

/**
 * **********
 * AppMap
 * ***********
 */
export interface PluginAppMap {
  [key: string]: {
    name: string
    APP: typeof APlugin
  }
}

/**
 * *******
 * CommandMap
 * *******
 * Command message
 * CommandNotMessage other message
 */
export type CommandMap = {
  [Event in (typeof EventEnum)[number]]: CommandType[]
}

/**
 * 应用
 */
class Application {
  mergedRegex: RegExp
  Command = {} as CommandMap
  CommandNotMessage = {} as CommandMap
  CommandApp = {} as PluginAppMap
  /**
   * 扫描插件
   */
  async load() {
    const dir = join(process.cwd(), APPCONFIG.get('dir'))
    if (!existsSync(dir)) return
    const flies = readdirSync(dir)
    if (flies.length == 0) return
    // 读取配置
    const open = APPCONFIG.get('openRegex')
    const close: undefined | RegExp = APPCONFIG.get('closeRegex')
    // 排除
    const apps = flies
      .filter(item => open.test(item))
      .filter(item => {
        if (!close) return true
        return !close.test(item)
      })
    //动态扫描
    const main = APPCONFIG.get('main')
    const typeVal = APPCONFIG.get('type')
    const types = []
    if (typeVal != 'stript') {
      types.push(typeVal)
    } else {
      types.push('js')
      types.push('ts')
    }
    for (const type of types) {
      for await (const appname of apps) {
        if (existsSync(`${dir}/${appname}${main}.${type}`)) {
          await import(`file://${dir}/${appname}${main}.${type}`).catch(err => {
            console.error(`file://${dir}/${appname}${main}.${type}`)
            // 属于依赖缺失
            const match = /Cannot find package '(.+)' imported from/.exec(
              err.message
            )
            if (match && match[1]) {
              const packageName = match[1]
              console.error(`[APP] [${appname}] 缺失 ${packageName} 包`)
              // 发送消息
              process.send?.({
                type: 'lack-of-package',
                message: {
                  packageName
                }
              })
              return
            } else {
              // 其他错误
              console.error(`[APP] [${appname}]`, err)
              process.send?.({
                type: 'error',
                message: err
              })
            }
          })
        }
      }
    }
    return
  }
  // 清空缓存
  del() {
    for (const item of EventEnum) {
      if (isNaN(Number(item))) {
        this.Command[item] = []
        this.CommandNotMessage[item] = []
      }
    }
    // 清class
    for (const item in this.CommandApp) {
      delete this.CommandApp[item]
    }
  }
  /**
   * 初始化
   */
  async init() {
    // 回调系统：排序
    CALL.order()
    // 正则系统：清空当前的apps
    this.del()
    // 得到所有插件名
    const APPARR = APP.getAllKey()
    // 导出所有插件名
    for await (const AppName of APPARR) {
      // 获取插件集
      const apps = APP.get(AppName)
      // 分析插件集
      await this.synthesis(AppName, apps)
      // 删除指集
      APP.del(AppName)
    }
    // 排序
    for (const val in this.Command) {
      this.Command[val] = orderBy(this.Command[val], ['priority'], ['asc'])
    }
    // 排序
    for (const val in this.CommandNotMessage) {
      this.CommandNotMessage[val] = orderBy(
        this.CommandNotMessage[val],
        ['priority'],
        ['asc']
      )
    }
    // 排序之后把所有正则变成一条正则
    const mergedRegexArr = []
    for (const val in this.Command) {
      for await (const { reg } of this.Command[val]) {
        mergedRegexArr.push(reg)
      }
    }
    // 机器人整体指令正则
    this.mergedRegex = new RegExp(
      mergedRegexArr.map(regex => regex.source).join('|')
    )
    // 生成指令json
    HELP.create()
    // 打印
    console.info('[APP INIT]', `APPS*${Object.keys(HELP.plugins).length} `)
  }

  /**
   * 应用挂载
   * @param AppName 插件名
   * @param AppsObj 插件集成对象
   */
  async synthesis(AppName: string, AppsObj: object) {
    // 没有记载
    if (!HELP.plugins[AppName]) HELP.plugins[AppName] = []
    const shield = APPCONFIG.get('event')
    for (const item in AppsObj) {
      // 取出实例
      const keys: APlugin = new AppsObj[item]()
      if (shield.find(item => item == keys['event'])) continue
      // 控制类型
      const typing: APluginInitType['typing'] = keys['typing'] ?? 'CREATE'
      // 不合法
      if (
        !keys['rule'] ||
        !Array.isArray(keys['rule']) ||
        keys['rule'].length == 0
      ) {
        continue
      }
      /**
       * 收藏app
       */
      let x = 1
      let itemX = item
      const T = true
      while (T) {
        // 名字不重复
        if (!Object.prototype.hasOwnProperty.call(this.CommandApp, itemX)) {
          break
        }
        // 同名了 需要重命名
        itemX = `${item}${x}`
        x++
      }
      // 缓存实例
      this.CommandApp[itemX] = {
        name: AppName,
        APP: AppsObj[item] as typeof APlugin
      }

      for await (const key of keys['rule']) {
        if (!key['fnc'] || typeof keys[key['fnc']] !== 'function') {
          /// 函数指定不存在 得到的不是函数
          continue
        }
        // 先看指令优先级,没有就看类优先级,再没有则默认优先级
        const priority = key['priority'] ?? keys['priority'] ?? 9000
        // 得到函数名
        const fncName = key['fnc']
        const doc = key['doc'] ?? ''
        const dsc = key['dsc'] ?? ''
        /**
         * 对比优先级,比设置的低
         */
        const AppPriority = PRIORITY.get(AppName)
        // 如果类型正确
        if (typeof key['reg'] === 'string' || key['reg'] instanceof RegExp) {
          // 存在正则就必须是MESSAGES
          const event: APluginInitType['event'] =
            EVENT.get(AppName) ?? 'MESSAGES'
          // 得到解析
          const reg = key['reg']
          if (!reg) continue
          // 推送
          HELP.plugins[AppName].push({
            event: event,
            typing: typing,
            reg: String(reg),
            dsc,
            doc,
            priority:
              AppPriority && AppPriority < priority ? AppPriority : priority
          })
          // 保存
          this.Command[event].push({
            event: event,
            typing: typing,
            reg: new RegExp(reg),
            priority,
            fncName,
            APP: itemX
          })
        } else {
          // 控制消息 -- 类型必须要存在的
          const event: APluginInitType['event'] = keys['event'] ?? 'MESSAGES'
          // 推送
          HELP.plugins[AppName].push({
            event: event,
            typing: typing,
            dsc,
            doc,
            priority
          })
          // 保存
          this.CommandNotMessage[event].push({
            event: event,
            typing: typing,
            priority:
              AppPriority && AppPriority < priority ? AppPriority : priority,
            reg: /./,
            fncName,
            APP: itemX
          })
        }
      }
    }
    return
  }
}
export const APPLICATION = new Application()
