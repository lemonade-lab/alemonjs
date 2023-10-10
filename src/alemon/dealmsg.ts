import { join } from 'path'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import lodash from 'lodash'
import { getMessage } from './message.js'
import { getApp, delApp, getAppKey } from './app.js'
import { compilationTools } from './build.js'
import { AMessage, EventType, EventEnum } from './typings.js'
import { conversationHandlers, getConversationState } from './dialogue.js'

/**
 * 指令可枚举类型
 */
interface CmdItemType {
  reg: RegExp
  priority: number
  event: (typeof EventEnum)[number]
  eventType: (typeof EventType)[number]
  belong: 'plugins' | 'example'
  AppName: string
  fncName: string
  fnc: (...args: any[]) => any
}

/**
 * 指令类型
 */
type CmdType = {
  [Event in (typeof EventEnum)[number]]: CmdItemType[]
}

/**
 * 指令合集
 */
const Command: CmdType = {} as CmdType

/**
 * 指令合集
 */
const CommandNotR: CmdType = {} as CmdType

/**
 * plugins插件集合
 */
let PluginsArr = []

/**
 * 指令json
 */
const plugins: object = {}

/**
 * 默认执行地址
 */
const route = '/help'

/**
 * 执行文件
 */
let addressMenu = join(process.cwd(), route)

/**
 * 大正则
 */

let mergedRegex: RegExp

/**
 * 设置指令json地址
 * @param rt '/help'
 */
export function setAppsHelp(rt = route) {
  addressMenu = join(process.cwd(), rt)
}

/**
 * 得到机器人帮助
 * @param AppName
 * @returns
 */
export function getPluginHelp(AppName: string) {
  const basePath = join(addressMenu, `${AppName}.json`)
  return JSON.parse(readFileSync(basePath, 'utf8'))
}

/**
 * 创建机器人帮助
 */
function createPluginHelp() {
  // 不存在
  if (!existsSync(addressMenu)) mkdirSync(addressMenu, { recursive: true })
  // 创建help
  for (const item in plugins) {
    const basePath = join(addressMenu, `${item}.json`)
    const jsonData = JSON.stringify(plugins[item], null, 2)
    // 异步创建避免阻塞
    writeFile(basePath, jsonData, 'utf-8')
  }
}

/**
 * 应用挂载
 * @param AppsObj
 * @param appname
 * @param belong
 */
async function synthesis(AppsObj: object, appname: string, belong: 'plugins' | 'example') {
  // 没有记载
  if (!plugins[appname]) {
    plugins[appname] = []
  }
  for (const item in AppsObj) {
    const keys = new AppsObj[item]()
    // 控制类型
    const eventType = keys['eventType'] ?? 'CREATE'
    /**
     * 不合法
     */
    if (!keys['rule'] || !Array.isArray(keys['rule']) || keys['rule'].length == 0) {
      continue
    }
    /**
     * 指令不存在
     */
    for await (const key of keys['rule']) {
      if (!key['fnc'] || !key['reg'] || typeof keys[key['fnc']] !== 'function') {
        /**
         * 函数指定不存在,正则不存在
         * 得到的不是函数
         */
        continue
      }
      // 先看指令优先级,没有就看类优先级,再没有则默认优先级
      const priority = key['priority'] ?? keys['priority'] ?? 9000
      // 得到函数名
      const fncName = key['fnc']
      // 得到函数
      const fnc = keys[fncName]
      const doc = key['doc'] ?? ''
      const dsc = key['dsc'] ?? ''

      // 如果类型正确
      if (typeof key['reg'] === 'string' || key['reg'] instanceof RegExp) {
        // 存在正则就必须是MESSAGES
        const event = 'MESSAGES'
        // 得到解析
        const reg = key['reg']
        // 推送
        plugins[appname].push({
          event: event,
          eventType: eventType,
          reg: String(reg),
          dsc,
          doc,
          priority
        })
        // 保存
        Command[event].push({
          belong,
          event: event,
          eventType: eventType,
          reg: new RegExp(reg),
          priority,
          fncName,
          fnc,
          AppName: appname
        })
      } else {
        // 控制消息 -- 类型必须要存在的
        const event = keys['event']
        // 推送
        plugins[appname].push({
          event: event,
          eventType: eventType,
          dsc,
          doc,
          priority
        })
        // 保存
        CommandNotR[event].push({
          belong,
          event: event,
          eventType: eventType,
          priority,
          fncName,
          fnc,
          AppName: appname
        })
      }
    }
  }
  return
}

/**
 * 加载应用插件
 * @param dir
 */
async function loadPlugins(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const flies = readdirSync(dir)
  /**
   * 识别并执行插件
   */
  for await (const appname of flies) {
    if (existsSync(`${dir}/${appname}/index.ts`)) {
      /**
       * 优先考虑ts
       */
      await import(`file://${dir}/${appname}/index.ts`).catch(err => {
        console.error(`file://${dir}/${appname}/index.ts`)
        console.error(err)
        process.exit()
      })
    } else if (existsSync(`${dir}/${appname}/index.js`)) {
      /**
       * 允许js写法
       */
      await import(`file://${dir}/${appname}/index.js`).catch(error => {
        console.error(`file://${dir}/${appname}/index.js`)
        console.error(error)
        process.exit()
      })
    }
  }
  return
}

/**
 * 初始化应用
 */
function dataInit() {
  PluginsArr = []
  for (const item of EventEnum) {
    if (isNaN(Number(item))) {
      Command[item] = []
      CommandNotR[item] = []
    }
  }
  return
}

/**
 * 应用初始化
 * @returns
 */
export async function appsInit() {
  /**
   * 清空当前的apps
   */
  dataInit()
  /**
   * 得到所有插件名
   */
  const APPARR = getAppKey()
  /**
   * 导出所有插件名
   */
  for await (const item of APPARR) {
    /**
     * 获取插件集
     */
    const apps = getApp(item)
    /**
     * 分析插件集
     */
    await synthesis(apps, item, 'plugins')
    /**
     * 记录该插件
     */
    PluginsArr.push(item)
    /**
     * 删除指集
     */
    delApp(item)
  }

  /***
   * 排序之后把所有正则变成一条正则
   */

  /**
   * 排序
   */
  for (const val in Command) {
    Command[val] = lodash.orderBy(Command[val], ['priority'], ['asc'])
  }

  const mergedRegexArr = []
  for (const val in Command) {
    for (const data of Command[val]) {
      if (data.reg !== undefined && data.eventType !== undefined) {
        mergedRegexArr.push(data.reg)
      }
    }
  }

  // 机器人整体指令正则
  mergedRegex = new RegExp(mergedRegexArr.map(regex => regex.source).join('|'))

  /**
   * 排序
   */
  for (const val in CommandNotR) {
    CommandNotR[val] = lodash.orderBy(CommandNotR[val], ['priority'], ['asc'])
  }

  /**
   * 生成指令json
   */
  createPluginHelp()
  /**
   * 打印
   */
  console.info(`[LOAD] Plugins*${PluginsArr.length} `)
  return
}

export function getMergedRegex() {
  return mergedRegex
}

/**
 *  初始化应用 mount = ture 则直接应用
 * @param param0 { mount = false, address = '/plugins' }
 * @returns
 */
export async function loadInit(
  val: {
    mount?: boolean
    address?: string
  } = { mount: false, address: '/plugins' }
) {
  const { mount, address } = val
  /**
   * 加载插件
   */
  await loadPlugins(join(process.cwd(), address ?? '/plugins'))
  /**
   * 取消集成
   */
  if (mount) return compilationTools
  /**
   * 开始集成
   */
  await appsInit()
  return
}

/**
 * 指令匹配
 * @param e
 * @returns
 */
export async function InstructionMatching(e: AMessage) {
  /**
   * 获取对话状态
   */
  const state = await getConversationState(e.user_id)
  /**
   * 获取对话处理函数
   */
  const handler = conversationHandlers.get(e.user_id)

  if (handler && state) {
    /**
     * 如果用户处于对话状态
     * 则调用对话处理函数
     */
    await handler(e, state)
    return true
  }
  /**
   *  撤回事件 匹配不到事件 或者 大正则不匹配
   */
  if (e.isRecall || !Command[e.event] || !mergedRegex.test(e.msg)) return true

  /**
   * 循环所有指令 用 awwat确保指令顺序
   */
  for await (const data of Command[e.event]) {
    if (e.eventType != data.eventType || data.reg === undefined || !data.reg.test(e.msg)) {
      continue
    }
    const AppFnc = getMessage(data.AppName)
    try {
      if (typeof AppFnc == 'function') e = AppFnc(e)
      const res = await data
        .fnc(e)
        .then((res: boolean) => {
          console.info(
            `\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${true}]`
          )
          return res
        })
        .catch((err: any) => {
          console.error(
            `\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${err}]`
          )
          console.error(
            `\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${false}]`
          )
          return false
        })
      // 不是false都直接中断匹配
      if (res !== false) {
        break
      }
    } catch (err) {
      logErr(err, data)
      return false
    }
  }

  return true
}

/**
 * 不匹配指令的方法
 * 只用匹配类型函数
 * @param e
 * @returns
 */
export async function typeMessage(e: AMessage) {
  if (!CommandNotR[e.event]) return true
  // 循环查找
  for (const data of CommandNotR[e.event]) {
    if (e.eventType != data.eventType) continue
    try {
      const AppFnc = getMessage(data.AppName)
      if (typeof AppFnc == 'function') e = AppFnc(e)
      const res = await data
        .fnc(e)
        .then((res: boolean) => {
          console.info(
            `\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${true}]`
          )
          return res
        })
        .catch((err: any) => {
          console.error(err)
          console.error(
            `\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${false}]`
          )
          return false
        })
      if (res) {
        break
      }
    } catch (err) {
      logErr(err, data)
      continue
    }
  }
  return true
}

/**
 * 错误信息反馈
 * @param err
 * @param data
 */
function logErr(err: any, data: CmdItemType) {
  console.error(err)
  console.error(`\n[${data.event}][${data.belong}][${data.AppName}][${data.fncName}][${false}]`)
  return
}
