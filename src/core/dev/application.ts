import { AMessage } from '../typings.js'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { APPCONFIG } from '../configs.js'
import { AppMap } from './data.js'
import { Subscribe } from './subscribe.js'

/**
 * 应用
 */
class App {
  /**
   * 扫码
   * @returns
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

  // 大正则数组
  #mergedRegexArr: RegExp[] = []
  // 数组化正则
  #regular: RegExp
  // 正则-key
  #regMap = {}

  subscribe = new Subscribe()

  /**
   * ***********
   * ***********
   */

  /**
   * 初始化
   */
  init() {
    // 得到所有key
    for (const item in AppMap.keys()) {
      const reg = AppMap.get(item).getReg()
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
    const channel_sb = this.subscribe.find(e.channel_id)
    if (channel_sb) {
      con = true
      const node = channel_sb.node
      AppMap.get(node.name).responseNode(e, node)
    }
    const user_sb = this.subscribe.find(e.user_id)
    if (user_sb && !con) {
      con = true
      const node = user_sb.node
      AppMap.get(node.name).responseNode(e, node)
      return
    }

    if (!con) return

    // 正则系统
    if (!this.trigger(e.msg)) return
    // 分发
    for (const item in this.#regMap) {
      // key触发
      if (new RegExp(item).test(e.msg)) {
        // app name
        AppMap.get(this.#regMap[item]).response(e)
      }
    }
  }

  /**
   * 响应消息类型
   * @param e
   */
  responseEventType(e: AMessage) {
    // 分发
    for (const item in AppMap.keys()) {
      AppMap.get(item).responseEventType(e)
    }
  }
}

// 索引系统
export const APPS = new App()
