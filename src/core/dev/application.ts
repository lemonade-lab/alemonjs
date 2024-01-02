import { AMessage } from '../typings.js'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { APPCONFIG } from '../configs.js'
import { DATA } from './data.js'

class App {
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

  // 大正则：
  #regular: RegExp
  // 大正则数组
  #mergedRegexArr: RegExp[] = []
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
  addSubscribe(key: string, id: any, c: string, f: string) {
    let con = false
    for (const item in DATA.all()) {
      // 寻找节点
      const node = DATA.get[item].find(c, f)
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
    // 得到所有key
    for (const item in DATA.all()) {
      const reg = DATA.get(item).getReg()
      if (reg) this.#mergedRegexArr.push()
    }
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
    let con = false
    const channel_sb = this.findSubscribe(e.channel_id)
    if (channel_sb) {
      con = true
      const node: {
        name: string
        i: string
        j: string
        func: string
      } = channel_sb.node

      DATA.get(node.name).responseNode(e, node)
    }

    const user_sb = this.findSubscribe(e.user_id)
    if (user_sb && !con) {
      con = true
      const node: {
        name: string
        i: string
        j: string
        func: string
      } = user_sb.node
      DATA.get(node.name).responseNode(e, node)
      return
    }

    if (!con) return

    // 正则系统
    if (!this.trigger(e.msg)) return
    const map = this.getMap()
    for (const item in map) {
      // key触发
      if (new RegExp(item).test(e.msg)) {
        // app name
        DATA.get(map[item]).response(e)
      }
    }
  }

  /**
   * 响应消息类型
   * @param e
   */
  responseEventType(e: AMessage) {
    // 分发出去
    for (const item in DATA.all()) {
      DATA.get(item).responseEventType(e)
    }
  }
}

/**
 * 索引系统
 */
export const APPS = new App()
