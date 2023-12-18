import { join } from 'path'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync, readdirSync } from 'fs'
import lodash from 'lodash'
import {
  getAppArg,
  getAppEvent,
  getAppCharacter,
  getAppMessage,
  getAppPriority,
  getAppSlicing
} from './cache.js'
import { getApp, delApp, getAppKey } from './app.js'
import { type AMessage, type TypingEnum, EventEnum } from './typings.js'
import { conversationHandlers, getConversationState } from './dialogue.js'
import { getAppProCoinfg } from './configs.js'
import { type PluginInitType, APlugin } from './plugin.js'
import { getAppCall, orderByAppCall } from './call.js'
/**
 * ************
 * 插件实例类型
 * ************
 */
type PluginApp = new (config: PluginInitType) => APlugin
/**
 * **************
 * CommandType
 * **************
 */
interface CommandType {
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
interface PluginAppMap {
  [key: string]: {
    name: string
    APP: PluginApp
  }
}

/**
 * *******
 * CommandMap
 * *******
 * Command message
 * CommandNotMessage other message
 */
type CommandMap = {
  [Event in (typeof EventEnum)[number]]: CommandType[]
}
const Command: CommandMap = {} as CommandMap
const CommandNotMessage: CommandMap = {} as CommandMap
const CommandApp: PluginAppMap = {}

/**
 * 机器人统计
 */
const plugins: object = {}

// 大正则
let mergedRegex: RegExp

/**
 * 创建机器人帮助
 */
function createPluginHelp() {
  const c = getAppProCoinfg('regex')
  if (c === false) return
  // 存在app才创建
  if (Object.values(plugins).length != 0) {
    // 同时key不能是空数组
    let t = false
    for (const item in plugins) {
      if (plugins[item] && plugins[item].length != 0) {
        t = true
      }
    }
    if (t) {
      const dir = join(process.cwd(), getAppProCoinfg('route'))
      // 不存在
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
      // 创建help
      for (const item in plugins) {
        if (plugins[item] && plugins[item].length != 0) {
          const basePath = join(dir, `${item}.json`)
          const jsonData = JSON.stringify(plugins[item], null, 2)
          // 异步创建避免阻塞
          writeFile(basePath, jsonData, 'utf-8')
        }
      }
    }
  }
}

/**
 * 应用挂载
 * @param AppName 插件名
 * @param AppsObj 插件集成对象
 */
async function synthesis(AppName: string, AppsObj: object) {
  // 没有记载
  if (!plugins[AppName]) plugins[AppName] = []
  const shield = getAppProCoinfg('event')
  for (const item in AppsObj) {
    const keys: APlugin = new AppsObj[item]()
    if (shield.find(item => item == keys['event'])) continue
    // 控制类型
    const typing: PluginInitType['typing'] = keys['typing'] ?? 'CREATE'
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
      if (!Object.prototype.hasOwnProperty.call(CommandApp, itemX)) {
        break
      }
      // 同名了 需要重命名
      itemX = `${item}${x}`
      x++
    }
    CommandApp[itemX] = {
      name: AppName,
      APP: AppsObj[item] as PluginApp
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
      const AppPriority = getAppPriority(AppName)
      // 如果类型正确
      if (typeof key['reg'] === 'string' || key['reg'] instanceof RegExp) {
        // 存在正则就必须是MESSAGES
        const event: PluginInitType['event'] =
          getAppEvent(AppName) ?? 'MESSAGES'
        // 得到解析
        const reg = key['reg']
        if (!reg) continue
        // 推送
        plugins[AppName].push({
          event: event,
          typing: typing,
          reg: String(reg),
          dsc,
          doc,
          priority:
            AppPriority && AppPriority < priority ? AppPriority : priority
        })
        // 保存
        Command[event].push({
          event: event,
          typing: typing,
          reg: new RegExp(reg),
          priority,
          fncName,
          APP: itemX
        })
      } else {
        // 控制消息 -- 类型必须要存在的
        const event: PluginInitType['event'] = keys['event']
        // 推送
        plugins[AppName].push({
          event: event,
          typing: typing,
          dsc,
          doc,
          priority
        })
        // 保存
        CommandNotMessage[event].push({
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

/**
 * 加载应用插件
 * @param dir 插件路径
 */
async function loadPlugins(dir: string) {
  if (!existsSync(dir)) return
  const flies = readdirSync(dir)
  if (flies.length == 0) return
  // 读取配置
  const open = getAppProCoinfg('openRegex')
  const close: undefined | RegExp = getAppProCoinfg('closeRegex')
  // 排除
  const apps = flies
    .filter(item => open.test(item))
    .filter(item => {
      if (!close) return true
      return !close.test(item)
    })
  //动态扫描
  const main = getAppProCoinfg('main')
  const typeVal = getAppProCoinfg('type')
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

/**
 * 初始化应用
 */
function dataInit() {
  // 清事件
  for (const item of EventEnum) {
    if (isNaN(Number(item))) {
      Command[item] = []
      CommandNotMessage[item] = []
    }
  }
  // 清class
  for (const item in CommandApp) {
    delete CommandApp[item]
  }
  return
}

/**
 * 插件初始化
 */
export async function appsInit() {
  /**
   * *********
   * 回调系统
   * ********
   */

  // 排序
  orderByAppCall()

  /**
   * ************
   * 正则系统
   * ************
   */

  // 清空当前的apps
  dataInit()
  // 得到所有插件名
  const APPARR = getAppKey()

  // 导出所有插件名
  for await (const AppName of APPARR) {
    // 获取插件集
    const apps = getApp(AppName)
    // 分析插件集
    await synthesis(AppName, apps)
    // 删除指集
    delApp(AppName)
  }

  // 排序
  for (const val in Command) {
    Command[val] = lodash.orderBy(Command[val], ['priority'], ['asc'])
  }

  // 排序
  for (const val in CommandNotMessage) {
    CommandNotMessage[val] = lodash.orderBy(
      CommandNotMessage[val],
      ['priority'],
      ['asc']
    )
  }

  // 排序之后把所有正则变成一条正则
  const mergedRegexArr = []
  for (const val in Command) {
    for await (const { reg } of Command[val]) {
      mergedRegexArr.push(reg)
    }
  }

  // 机器人整体指令正则
  mergedRegex = new RegExp(mergedRegexArr.map(regex => regex.source).join('|'))

  // 生成指令json
  createPluginHelp()

  // 打印
  console.info('[APP INIT]', `APPS*${Object.keys(plugins).length} `)
}

/**
 * 得到指令大正则
 * @returns 正则
 */
export function getMergedRegex() {
  return mergedRegex
}

/**
 * 扫描插件
 */
export async function loadInit() {
  await loadPlugins(join(process.cwd(), getAppProCoinfg('dir')))
}

/**
 * 指令匹配
 * @param e alemonjs message
 * @returns 是否处理完成
 */
export async function InstructionMatching(e: AMessage) {
  if (process.env?.ALEMONJS_MESSAGE == 'dev') console.info('e', e)

  /**
   * 对话机
   */
  const guild_state = await getConversationState(e.guild_id)
  const channel_state = await getConversationState(e.channel_id)
  const user_state = await getConversationState(e.user_id)

  if (guild_state || channel_state || user_state) {
    const guild_handler = conversationHandlers.get(e.guild_id)
    if (guild_handler) await guild_handler(e, guild_state)
    const channel_handler = conversationHandlers.get(e.channel_id)
    if (channel_handler) await channel_handler(e, channel_state)
    const user_handler = conversationHandlers.get(e.user_id)
    if (user_handler) await user_handler(e, user_state)
    return true
  }

  let t = false

  /**
   * 回调系统
   */
  for (const app of getAppCall('MESSAGES')) {
    if (t === true) break
    try {
      // app.call
      const back = await app.call(e)
      if (back === true) {
        t = back
      }
    } catch (err) {
      console.error(`[${e.event}]`, `[${app.call}]`, `[${false}]\n`, `[${err}]`)
      continue
    }
  }

  /**
   * 回调系统
   */
  for (const app of getAppCall('message')) {
    if (t === true) break
    try {
      // app.call
      const back = await app.call(e)
      if (back === true) {
        t = back
      }
    } catch (err) {
      console.error(`[${e.event}]`, `[${app.call}]`, `[${false}]\n`, `[${err}]`)
      continue
    }
  }

  const APPCACHE: {
    [key: string]: APlugin
  } = {}

  const ARGCACHE: {
    [key: string]: any[]
  } = {}

  /**
   * 上下文
   */
  for (const item in CommandApp) {
    const { name, APP } = CommandApp[item]
    const AppFnc = getAppMessage(name)
    const AppArg = getAppArg(name)

    /**
     * tudo
     * 废弃
     */
    const _character = getAppProCoinfg('character')
    if (_character.test(e.msg)) {
      const character = getAppCharacter(name)
      const __character = getAppProCoinfg('defaultCharacter')
      e.msg = e.msg.replace(_character, character ?? __character)
    }

    const arr = getAppSlicing(name)
    if (arr && Array.isArray(arr) && arr.length != 0) {
      for (const item of arr) {
        e.msg = e.msg.replace(item.reg, item.str)
      }
    }

    try {
      if (typeof AppFnc == 'function') e = await AppFnc(e)
      if (typeof AppArg == 'function') ARGCACHE[item] = await AppArg(e)
      const app = new APP(e)
      // 设置this.e
      app.e = e
      // 如果存在用户上下文
      if (app.getContext) {
        // 得到缓存
        const context = app.getContext()
        // 是否为 null && undefined && '' && [] && {}
        if (!lodash.isEmpty(context)) {
          // 得到缓存中的e消息
          for (const fnc in context) {
            // 丢给自己
            if (app[fnc]) app[fnc](context[fnc])
          }
          return
        }
      }
      // 如果存在频道上下文
      if (app.getContextGroup) {
        // 得到缓存
        const context = app.getContextGroup()
        // 是否为 null && undefined && '' && [] && {}
        if (!lodash.isEmpty(context)) {
          // 得到缓存中的e消息
          for (const fnc in context) {
            // 丢给自己
            if (app[fnc]) app[fnc](context[fnc])
            return
          }
        }
      }
      APPCACHE[item] = app
    } catch (err) {
      console.error('APP ERR', err)
      return
    }
  }

  /**
   *  撤回事件 || 匹配不到事件 || 大正则不匹配
   */
  if (!Command[e.event] || !mergedRegex.test(e.msg)) return true

  /**
   * 循环所有指令
   */
  for (const data of Command[e.event]) {
    if (
      e.typing != data.typing ||
      data.reg === undefined ||
      !data.reg.test(e.msg)
    ) {
      continue
    }
    try {
      const app = APPCACHE[data.APP]
      const res = await app[data.fncName](...[e, ...(ARGCACHE[data.APP] ?? [])])
        .then(info(data))
        .catch(logErr(data))
      if (typeof res != 'boolean') {
        e.reply(res).catch(err => {
          console.error('APP REPLY', err)
        })
      }
      if (res != false) break
    } catch (err) {
      logErr(data)(err)
      return false
    }
  }
  return true
}

/**
 * 不匹配指令的方法
 * 只用匹配类型函数
 * @param e alemonjs message
 * @returns 是否处理完成
 */
export async function typeMessage(e: AMessage) {
  if (process.env?.ALEMONJS_MESSAGE == 'dev') console.info('e', e)

  if (!CommandNotMessage[e.event]) return true

  /**
   * 回调系统
   */
  const event = getAppCall(e.event)
  for (const app of event) {
    try {
      // app.call
      const back = await app.call(e)
      if (back === true) break
    } catch (err) {
      console.error(`[${e.event}]`, `[${app.call}]`, `[${false}]\n`, `[${err}]`)
      continue
    }
  }

  const APPCACHE: {
    [key: string]: APlugin
  } = {}

  const ARGCACHE: {
    [key: string]: any[]
  } = {}

  for (const item in CommandApp) {
    const { name, APP } = CommandApp[item]
    const AppFnc = getAppMessage(name)
    const AppArg = getAppArg(name)
    try {
      if (typeof AppFnc == 'function') e = await AppFnc(e)
      if (typeof AppArg == 'function') ARGCACHE[item] = await AppArg(e)
      const app = new APP(e)
      app.e = e
      APPCACHE[item] = app
    } catch (err) {
      console.error('APP', err)
      return
    }
  }

  // 循环查找
  for (const data of CommandNotMessage[e.event]) {
    if (e.typing != data.typing) continue
    try {
      const app = APPCACHE[data.APP]
      const res = await app[data.fncName](...[e, ...(ARGCACHE[data.APP] ?? [])])
      if (typeof res != 'boolean') {
        e.reply(res).catch(err => {
          console.error('APP REPLY', err)
        })
      }
      if (res != false) break
    } catch (err) {
      logErr(data)(err)
      continue
    }
  }
  return true
}

function logErr(data: CommandType) {
  return (err: any) => {
    console.error(
      `[${data.event}]`,
      `[${data.fncName}]`,
      `[${false}]\n`,
      `[${err}]`
    )
    return false
  }
}

function info(data: CommandType) {
  return (res: boolean) => {
    console.info(`[${data.event}]`, `[${data.fncName}]`, `[${true}]`)
    return res
  }
}
