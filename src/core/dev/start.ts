import { AMessage, EventEnum } from '../typings.js'
import { APlugin } from '../plugin/index.js'
import { CALL } from '../call.js'
import { getAppName } from '../apps.js'
import { List } from '../structure/list.js'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { APPCONFIG } from '../configs.js'

/**
 * *************
 * v1.2
 * (0)  正常机器人正则来判断是否处理
 * (1)  每个应用独立
 * (2)  内容分发
 * (3)  应用内部使用list记录索引
 * (4)  生成大正则来判断是否进入应用
 * (5)  识别的时候就初始化应用
 * *****************
 * 上下文: 发布订阅模式
 * *****************
 * 对话机: 也采用发布订阅模式?
 * *****************
 */

class App {
  // 应用集合
  #data: {
    [key: string]: typeof Alemon.prototype
  } = {}
  // 大正则：
  #regular: RegExp
  // 大正则数组
  #mergedRegexArr: RegExp[]
  // 正则-key
  #regMap = {}

  // 订阅详细
  #sb: {
    [key: string]: {
      id: any
      node: any
    }
  } = {}

  /**
   * 发布订阅
   * @param key
   * @param id
   * @param c
   * @param f
   * @returns
   */
  subscribe(key: string, id: any, c: string, f: string) {
    let con = false
    for (const item in this.#data) {
      // 寻找节点
      const node = this.#data[item].find(c, f)
      if (node) {
        con = true
        // 记录订阅
        this.#sb[key] = {
          id, // 定时器
          node // 节点
        }
        break
      }
    }
    return con
  }

  /**
   * 取消订阅
   * @param key
   * @param c
   * @param f
   */
  unsubscribe(key: string, c: string, f: string) {
    // 取消的时候,先把定时器关闭
    if (!Object.prototype.hasOwnProperty.call(this.#sb, key)) return false
    const id = this.#sb[key].id
    clearTimeout(id)
    delete this.#sb[key]
    return false
  }

  /**
   * 寻找订阅
   * @param key
   * @param c
   * @param f
   * @returns
   */
  findSubscribe(key: string) {
    // 取消的时候,先把定时器关闭
    if (!Object.prototype.hasOwnProperty.call(this.#sb, key)) return false
    return this.#sb[key]
  }

  /**
   * 得到大正则
   * @returns
   */
  getReg() {
    return this.#regular
  }

  /**
   * 得到正则key
   * @returns
   */
  getMap() {
    return this.#regMap
  }

  /**
   * 得到应用
   * @param key
   * @returns
   */
  get(key: string) {
    return this.#data[key]
  }

  /**
   * 设置应用
   * @param key
   * @param val
   */
  set(key: string, val: typeof Alemon.prototype) {
    // 进来就要推送正则key
    const reg = val.getReg()
    if (reg) {
      // reg - key
      this.#regMap[String(reg)] = key
      this.#mergedRegexArr.push(reg)
    }
    // 保存
    this.#data[key] = val
  }

  /**
   * 删除应用
   * @param key
   */
  del(key: string) {
    delete this.#data[key]
  }

  /**
   * 扫描插件
   */
  load() {
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
      for (const appname of apps) {
        if (existsSync(`${dir}/${appname}${main}.${type}`)) {
          import(`file://${dir}/${appname}${main}.${type}`).catch(err => {
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
   * 删除指定模块
   * @param key
   * @param model
   */
  delModel(key: string, model: string) {
    //
  }

  /**
   * 增加指定模块
   * @param key
   */
  addModel(key: string) {
    //
  }

  /**
   * 初始化
   */
  init() {
    // 构造大正则
    this.#regular = new RegExp(
      this.#mergedRegexArr.map(regex => regex.source).join('|')
    )
  }

  /**
   * 判断指定的消息是否可以触发机器人
   * @param msg
   * @returns
   */
  trigger(msg: string) {
    // 没有任何指令
    if (!this.#regular) return false
    // 存在索引
    if (this.#regular.test(msg)) return true
    return false
  }

  /**
   * 响应消息
   * @param e
   * @returns
   */
  response(e: AMessage) {
    // 订阅系统

    /**
     * 识别该用户是否有订阅
     */

    const user_sb = this.findSubscribe(e.user_id)
    if (user_sb) {
      const node: {
        name: string
        i: string
        j: string
        func: string
      } = user_sb.node

      this.#data[node.name].response(e)

      return
    }
    const channel_sb = this.findSubscribe(e.channel_id)
    if (channel_sb) {
      //
      return
    }

    // 正则系统
    if (!this.trigger(e.msg)) return
    const map = this.getMap()
    for (const item in map) {
      // key触发
      if (new RegExp(item).test(e.msg)) {
        // app name
        this.get(map[item]).response(e)
      }
    }
  }

  /**
   * 响应消息类型
   * @param e
   */
  responseEventType(e: AMessage) {
    // 分发出去
    for (const item in this.#data) {
      this.#data[item].responseEventType(e)
    }
  }
}

// 应用系统

export const APP = new App()

/**
 * 应用结构
 */
class Alemon {
  // 应用名
  #name: string
  // 数据
  #data: {
    [key: string]: {
      [key: string]: typeof APlugin
    }
  } = {}
  // map计数
  #acount = 0
  // 配置缓存
  #dataMap = new Map()
  // 切割字符串数据集
  #strArr = []
  // 正则集
  #mergedRegexArr: RegExp[] = []
  // 大正则
  #regular: RegExp
  // 链表
  #list = new List()
  // 事件链表
  #elist = new List()

  // 寻找指定class - func
  find(c: string, f: string) {
    // 存在则返回
    const list = this.#list
    let val = null
    for (let i = 0; i < list.size(); i++) {
      const node: {
        i: string
        j: string
        reg: RegExp
        func: string
      } = list.removeAt(0)
      if (node.j == c && node.func == f) {
        val = node
        break
      }
    }
    return val
  }

  /**
   * 得到大正则
   * @returns
   */
  getReg() {
    return this.#regular
  }

  /**
   * 应用解析
   * @param e
   */
  async response(e: AMessage) {
    // 空的
    if (this.#list.isEmpty) return
    // 消息进来,开始走表
    const list = this.#list
    // 缓存 new
    const cache: {
      [key: string]: typeof APlugin.prototype
    } = {}

    /**
     * **********
     * 构造配置
     * **********
     */
    const func = this.#dataMap.get('event')
    if (func) e = func(e)
    for (const item of this.#strArr) {
      e.msg = e.msg.replace(item.reg, item.str)
    }
    const argFunc = this.#dataMap.get('arg')
    let arr = []
    if (typeof argFunc == 'function') {
      arr = await argFunc(e)
    }

    /**
     * *******
     * 走表
     * **********
     */
    for (let i = 0; i < list.size(); i++) {
      // 不断的取出索引
      const node: {
        i: string
        j: string
        reg: RegExp
        func: string
      } = list.removeAt(0)
      // 索引匹配
      if (node.reg.test(e.msg)) {
        const key = `${node.i}${node.j}`
        // 看看有没有缓存new
        if (!Object.prototype.hasOwnProperty.call(cache, key)) {
          const app = new this.#data[node.i][node.j]()
          app.e = e
          cache[key] = app
        }
        // 执行
        const res = await cache[key][node.func](e, ...arr)
          .then(res => {
            console.info(this.info(e, String(node.func)))
            return res
          })
          .catch(err => {
            console.error(this.err(e, String(node.func)), err)
          })
        // 重执行
        if (res && typeof res != 'boolean') {
          await e.reply(res).catch(err => {
            console.error(this.err(e, String(node.func)), err)
          })
        }
        // 不是 false ,也就是不放行
        if (res != false) break
      }
    }
  }

  /**
   * 响应消息类型
   * @param e
   */
  async responseEventType(e: AMessage) {
    // 空的
    if (this.#elist.isEmpty) return
    const list = this.#elist
    const cache: {
      [key: string]: typeof APlugin.prototype
    } = {}
    /**
     * *****
     * ******
     */
    const func = this.#dataMap.get('event')
    if (func) e = func(e)
    for (const item of this.#strArr) {
      e.msg = e.msg.replace(item.reg, item.str)
    }
    const argFunc = this.#dataMap.get('arg')
    let arr = []
    if (typeof argFunc == 'function') {
      arr = await argFunc(e)
    }
    /**
     * ******
     * *****
     */
    for (let i = 0; i < list.size(); i++) {
      const node: {
        i: string
        j: string
        event: string
        typing: string
        func: string
      } = list.removeAt(0)
      // 类型不符
      if (node.event !== e.event || node.typing !== e.typing) continue
      //
      const key = `${node.i}${node.j}`
      if (!Object.prototype.hasOwnProperty.call(cache, key)) {
        const app = new this.#data[node.i][node.j]()
        app.e = e
        cache[key] = app
      }
      const res = await cache[key][node.func](e, ...arr)
        .then(res => {
          console.info(this.info(e, String(node.func)))
          return res
        })
        .catch(err => {
          console.error(this.err(e, String(node.func)), err)
        })
      if (res && typeof res != 'boolean') {
        await e.reply(res).catch(err => {
          console.error(this.err(e, String(node.func)), err)
        })
      }
      // 不是 false ,也就是不放行
      if (res != false) break
    }
  }

  /**
   * 创建应用
   * @param name 应用名
   */
  constructor(name: string) {
    this.#name = name
  }

  /**
   * 扩展参数
   * @param fnc
   * @returns
   */
  arg(fnc: (e: AMessage) => any[] | Promise<any[]>) {
    this.#dataMap.set('arg', fnc)
    return this
  }

  /**
   * 重定义ecent
   * @param fnc
   * @returns
   */
  event(fnc: (...args: any[]) => any) {
    this.#dataMap.set('event', fnc)
    return this
  }

  /**
   * 字符串切割
   * @param reg
   * @param str
   * @returns
   */
  replace(reg: RegExp, str: string) {
    this.#strArr.push({
      str,
      reg
    })
    return this
  }

  /**
   * 集合
   * @param AplguinMap
   * @returns
   */
  use(
    AplguinMap: {
      [key: string]: typeof APlugin
    } = {}
  ) {
    try {
      this.#data[this.#acount] = AplguinMap
      this.#acount++
    } catch (err) {
      console.error('APP use', err)
    }
    return this
  }

  /**
   * 增加新模块
   * @param key
   */
  addModel(key: string) {
    //
  }

  /**
   * 删除模块
   * @param key
   */
  delModel(key: string) {
    //
  }

  /**
   * 挂载应用
   */
  mount() {
    for (const i in this.#data) {
      for (const j in this.#data[i]) {
        const keys = new this.#data[i][j]()
        // 忽视非法key
        if (
          !keys['rule'] ||
          !Array.isArray(keys['rule']) ||
          keys['rule'].length == 0
        ) {
          continue
        }
        for (const key of keys['rule']) {
          // 不是字符串,也不是函数
          const ty = typeof key['fnc']
          if (ty !== 'string' && ty !== 'function') {
            continue
          }
          // 是字符串,但匹配不出函数
          if (
            typeof key['fnc'] == 'string' &&
            typeof keys[key['fnc']] !== 'function'
          ) {
            /// 函数指定不存在 得到的不是函数
            continue
          }
          // 解析出索引
          if (typeof key['reg'] === 'string' || key['reg'] instanceof RegExp) {
            // 消息索引
            const reg = new RegExp(key['reg'])
            this.#mergedRegexArr.push(reg)
            this.#list.push({
              name: this.#name,
              i,
              j,
              reg,
              priority: key['priority'],
              func:
                ty == 'string'
                  ? key['fnc']
                  : String(key['fnc']).match(/:\s*(\w+)\]/)[1]
            })
          } else {
            // 类型索引
            this.#elist.push({
              name: this.#name,
              i,
              j,
              event: keys['event'],
              typing: keys['typing'],
              priority: key['priority'],
              func:
                ty == 'string'
                  ? key['fnc']
                  : String(key['fnc']).match(/:\s*(\w+)\]/)[1]
            })
          }
        }
      }
    }

    // 构造大正则
    this.#regular = new RegExp(
      this.#mergedRegexArr.map(regex => regex.source).join('|')
    )

    // 先删除,确保之前的释放
    APP.del(this.#name)

    // 推送
    APP.set(this.#name, this)
  }

  /**
   * 错误打印
   * @param data
   * @param funcName
   * @returns
   */
  err(e: AMessage, funcName: string) {
    return `[${e.event}] [${false}] [${funcName}]`
  }

  /**
   * 自定义
   * @param data
   * @param funcName
   * @returns
   */
  info(e: AMessage, funcName: string) {
    return `[${e.event}] [${true}] [${funcName}]`
  }

  /**
   * 监听系统
   * @param event 事件
   * @param call 回调
   * @param priority 优先级
   * @returns
   */
  on(
    event: (typeof EventEnum)[number],
    call: (e: AMessage) => any,
    priority: 9000
  ) {
    try {
      // 强制为大写的
      CALL.set(event == 'message' ? 'MESSAGES' : event, call, priority)
    } catch (err) {
      console.error('APP on', err)
    }
    return this
  }
}

/**
 * 创建指定名称应用
 * @param AppName
 * @returns
 */
export function createSubApp(AppName: string) {
  return new Alemon(AppName)
}

/**
 * 创建应用对象
 * @param url import.meta.url
 * @returns
 */
export function createApp(url: string | URL) {
  return createSubApp(getAppName(url))
}

// const app = createApp('')
