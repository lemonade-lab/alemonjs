import { AEvent, EventEnum } from '../typings.js'
import { join } from 'path'
import { existsSync, readdirSync } from 'fs'
import { APPCONFIG } from './configs.js'
import { AppMap } from './data.js'
import { ASubscribe } from './subscribe.js'
import { loadError } from './log.js'

/**
 * 应用
 */
class App {
  /**
   * 扫码
   * @returns
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
      for (const appname of apps) {
        if (existsSync(`${dir}/${appname}${main}.${type}`)) {
          await import(`file://${dir}/${appname}${main}.${type}`).catch(err => {
            console.error(`file://${dir}/${appname}${main}.${type}`)
            loadError(appname, err)
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
   * 响应回调
   * @param e
   * @returns
   */
  response(e: AEvent, event: (typeof EventEnum)[number]) {
    console.info(`[${e.event}] [${e.typing}] ${e.msg}`)
    // 分发
    for (const [item, app] of AppMap) {
      app.response(e, event)
    }
  }

  /**
   * 响应消息
   * @param e
   * @returns
   */
  responseMessage(e: AEvent) {
    if ((process.env.ALEMONJS_AEVENT = 'dev')) console.log('aevent', e)

    console.info(`[${e.event}] [${e.typing}] ${e.msg}`)
    let con = false
    const channel_sb = ASubscribe.find(e.channel_id)
    if (channel_sb && channel_sb.node) {
      con = true
      AppMap.get(channel_sb.node.name).responseNode(e, channel_sb.node)
    }
    const user_sb = ASubscribe.find(e.user_id)
    if (user_sb && user_sb.node && !con) {
      con = true
      AppMap.get(user_sb.node.name).responseNode(e, user_sb.node)
      return
    }

    if (con) return

    // 正则系统
    if (!this.trigger(e.msg)) return

    // 分发
    for (const [item, app] of AppMap) {
      // app name
      app.responseMessage(e)
    }
  }

  /**
   * 响应消息类型
   * @param e
   */
  responseEventType(e: AEvent) {
    console.info(`[${e.event}] [${e.typing}]`)
    // 分发
    for (const [item, app] of AppMap) {
      app.responseEventType(e)
    }
  }
}

// 索引系统
export const APPS = new App()
