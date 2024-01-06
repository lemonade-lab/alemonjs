import { AMessage, EventEnum } from '../typings.js'
import { APlugin } from '../plugin/index.js'
import { CALL } from '../call.js'
import { ListTable, NodeDataType } from './listtable.js'
import { AppMap } from './data.js'
import { getAppName } from './path.js'

/**
 * 应用结构
 */
export class Alemon {
  // 应用名
  #name = 'alemonb'
  // map计数
  #acount = 0
  // 集合
  #data: {
    // 集合索引
    [key: string]: {
      // 应用索引 - 应用
      [key: string]: typeof APlugin.prototype
      //
    }
  } = {}
  // 配置缓存
  #dataMap = new Map<string, any>()
  // 切割字符串数据集
  #strArr = []
  // 正则集
  #mergedRegexArr: RegExp[] = []
  // 大正则
  #regular: RegExp | null = null
  // 消息链表
  #list = new ListTable()
  // 事件链表
  #elist = new ListTable()

  /**
   * 创建应用
   * @param name 应用名
   */
  constructor(name: string) {
    this.#name = name
  }

  /**
   * 寻找节点
   * @param acount
   * @param example
   * @param func
   * @returns
   */
  find(acount: number, example: string, func: string) {
    if (
      this.#data[acount][example] &&
      this.#data[acount][example][func] &&
      typeof this.#data[acount][example][func] == 'function'
    ) {
      return {
        name: this.#name,
        acount: acount,
        example: example,
        reg: /.*/,
        event: 'MESSAGES',
        typing: 'CREATE',
        priority: 90000,
        func: func
      }
    }
  }

  /**
   * 得到大正则
   * @returns
   */
  getReg() {
    return this.#regular
  }

  /**
   * 根据节点响应
   * @param e
   * @param node
   */
  async responseNode(e: AMessage, node: NodeDataType) {
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

    this.#data[node.acount][node.example].e = e

    // 执行
    const res = await this.#data[node.acount][node.example]
      [node.func](e, ...arr)
      .then(res => {
        console.info(this.info(e, node.func))
        return res
      })
      .catch(err => {
        console.error(this.err(e, node.func), err)
      })
    // 重执行
    if (res && typeof res != 'boolean') {
      await e.reply(res).catch(err => {
        console.error(this.err(e, node.func), err)
      })
    }
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
      const node = list.removeAt(0)
      // 索引匹配
      if (node.reg.test(e.msg)) {
        this.#data[node.acount][node.example].e = e
        try {
          // 执行
          const res = await this.#data[node.acount][node.example]
            [node.func](e, ...arr)
            .then(res => {
              console.info(this.info(e, node.func))
              return res
            })
            .catch(err => {
              console.error(this.err(e, node.func), err)
              // 错误了就强制中断
            })
          // 重执行
          if (res && typeof res != 'boolean') {
            await e.reply(res).catch(err => {
              console.error(this.err(e, node.func), err)
            })
          }
          // 不是 false ,也就是不放行
          if (res != false) break
        } catch (err) {
          console.error(this.err(e, node.func), err)
          break
        }
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
      const node = list.removeAt(0)
      // 类型不符
      if (node.event !== e.event || node.typing !== e.typing) continue
      //
      this.#data[node.acount][node.example].e = e
      try {
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
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
      } catch (err) {
        console.error(this.err(e, String(node.func)), err)
        break
      }
    }
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
    // 分配集合
    this.#data[this.#acount] = {}
    // 收集
    for (const example in AplguinMap) {
      const keys = new AplguinMap[example]()
      // 标记name和层级
      keys.name = this.#name
      keys.acount = this.#acount
      // 记录
      this.#data[this.#acount][example] = keys
      // 忽视非法key
      if (
        !keys['rule'] ||
        !Array.isArray(keys['rule']) ||
        keys['rule'].length == 0
      ) {
        continue
      }
      for (const key of keys['rule']) {
        const ty = typeof key['fnc']
        if (
          (ty !== 'string' && ty !== 'function') ||
          (typeof key['fnc'] == 'string' &&
            typeof keys[key['fnc']] !== 'function')
        ) {
          // 不是字符串,也不是函数
          // 是字符串,但匹配不出函数
          continue
        }
        const node = {
          name: keys.name,
          acount: keys.acount,
          example: example,
          event: keys['event'],
          typing: keys['typing'],
          reg: /.*/,
          priority: key['priority'],
          func:
            typeof key['fnc'] == 'string'
              ? key['fnc']
              : String(key['fnc']).match(/:\s*(\w+)\]/)[1]
        }
        // 解析出索引
        if (typeof key['reg'] === 'string' || key['reg'] instanceof RegExp) {
          // 消息索引
          const reg = new RegExp(key['reg'])
          this.#mergedRegexArr.push(reg)
          // 更改内容
          node.reg = reg
          node.event = 'MESSAGES'
          node.typing = 'CREATE'
          if (this.#list.isEmpty()) {
            this.#list.push(node)
          } else {
            // 条件插入
            if (
              !this.#list.traverseAndInsert(
                node => key['priority'] < node.priority,
                node
              )
            ) {
              // 没插入,就说明走到尾巴都没满足
              this.#list.push(node)
            }
          }
          continue
        }
        // 类型索引
        if (this.#elist.isEmpty()) {
          this.#elist.push(node)
        } else {
          // 条件插入
          if (
            !this.#elist.traverseAndInsert(
              node => key['priority'] < node.priority,
              node
            )
          ) {
            // 没插入,就说明走到尾巴都没满足
            this.#elist.push(node)
          }
        }
        continue
      }
    }
    // 累计
    this.#acount++
    return this
  }

  /**
   * 挂载
   */
  mount() {
    // 构造大正则
    this.#regular = new RegExp(
      this.#mergedRegexArr.map(regex => regex.source).join('|')
    )
    AppMap.set(this.#name, this)
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
    // 强制为大写的
    CALL.set(event == 'message' ? 'MESSAGES' : event, call, priority)
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
export function createApp(url: string) {
  return createSubApp(getAppName(url))
}
