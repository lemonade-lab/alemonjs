import { join } from 'path'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import lodash from 'lodash'
import { getMessage } from './message.js'
import { getApp, delApp, getAppKey } from './app.js'
import { AMessage, EventType, EventEnum } from './typings.js'
import { conversationHandlers, getConversationState } from './dialogue.js'
import { getAppProCoinfg } from './configs.js'
/**
 * **************
 * CommandType
 * **************
 */
interface CommandType {
  reg: RegExp
  priority: number
  event: (typeof EventEnum)[number]
  eventType: (typeof EventType)[number]
  AppName: string
  fncName: string
  fnc: (...args: any[]) => any
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
/**
 * 机器人统计
 */
const plugins: object = {}
// 大正则
let mergedRegex: RegExp

/**
 * 得到机器人帮助
 * @param AppName
 * @returns
 */
export function getPluginHelp(AppName: string) {
  const dir = getAppProCoinfg('route')
  const basePath = join(process.cwd(), dir, `${AppName}.json`)
  return JSON.parse(readFileSync(basePath, 'utf8'))
}

/**
 * 创建机器人帮助
 */
function createPluginHelp() {
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
 * @param AppsObj
 * @param appname
 */
async function synthesis(AppsObj: object, appname: string) {
  // 没有记载
  if (!plugins[appname]) {
    plugins[appname] = []
  }
  for (const item in AppsObj) {
    const keys = new AppsObj[item]()
    // 控制类型
    const eventType = keys['eventType'] ?? 'CREATE'
    // 不合法
    if (
      !keys['rule'] ||
      !Array.isArray(keys['rule']) ||
      keys['rule'].length == 0
    ) {
      continue
    }
    // 指令不存在
    for await (const key of keys['rule']) {
      if (
        !key['fnc'] ||
        !key['reg'] ||
        typeof keys[key['fnc']] !== 'function'
      ) {
        /// 函数指定不存在,正则不存在 得到的不是函数
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
        CommandNotMessage[event].push({
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

  /**
   * 动态扫描
   */
  const main = getAppProCoinfg('main')
  const type = getAppProCoinfg('type')
  for await (const appname of apps) {
    if (existsSync(`${dir}/${appname}${main}.${type}`)) {
      await import(`file://${dir}/${appname}${main}.${type}`).catch(err => {
        console.error(`file://${dir}/${appname}${main}.${type}`)
        console.error(err)
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
  for (const item of EventEnum) {
    if (isNaN(Number(item))) {
      Command[item] = []
      CommandNotMessage[item] = []
    }
  }
  return
}

/**
 * 应用初始化
 * @returns
 */
export async function appsInit() {
  // 清空当前的apps
  dataInit()
  // 得到所有插件名
  const APPARR = getAppKey()
  // 导出所有插件名
  for await (const item of APPARR) {
    // 获取插件集
    const apps = getApp(item)
    // 分析插件集
    await synthesis(apps, item)
    // 删除指集
    delApp(item)
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
  console.info(`[LOAD] APPS*${Object.keys(plugins).length} `)
  return
}

/**
 * 得到大正则
 * @returns
 */
export function getMergedRegex() {
  return mergedRegex
}

/**
 * 初始化应用
 * @returns
 */
export async function loadInit() {
  await loadPlugins(join(process.cwd(), getAppProCoinfg('dir')))
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
  /**
   * 拦截
   */
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
    if (
      e.eventType != data.eventType ||
      data.reg === undefined ||
      !data.reg.test(e.msg)
    ) {
      continue
    }
    const AppFnc = getMessage(data.AppName)
    try {
      if (typeof AppFnc == 'function') e = AppFnc(e)
      const res = await data
        .fnc(e)
        .then((res: boolean) => {
          console.info(
            `\n[${data.event}][${data.AppName}][${data.fncName}][${true}]`
          )
          return res
        })
        .catch((err: any) => {
          console.error(
            `\n[${data.event}][${data.AppName}][${
              data.fncName
            }][${false}]\n[${err}]`
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
  if (!CommandNotMessage[e.event]) return true
  // 循环查找
  for (const data of CommandNotMessage[e.event]) {
    if (e.eventType != data.eventType) continue
    try {
      const AppFnc = getMessage(data.AppName)
      if (typeof AppFnc == 'function') e = AppFnc(e)
      const res = await data
        .fnc(e)
        .then((res: boolean) => {
          console.info(
            `\n[${data.event}][${data.AppName}][${data.fncName}][${true}]`
          )
          return res
        })
        .catch((err: any) => {
          console.error(
            `\n[${data.event}][${data.AppName}][${
              data.fncName
            }][${false}]\n[${err}]`
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
function logErr(err: any, data: CommandType) {
  console.error(
    `\n[${data.event}][${data.AppName}][${data.fncName}][${false}]\n[${err}]`
  )
  return
}
