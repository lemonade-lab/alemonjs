import { AMessage, EventEnum } from '../typings.js'
import { APlugin } from './plugin.js'
import { NodeDataType } from './types.js'
import { AppMap } from './data.js'
import { getAppName } from './path.js'
import { DoublyLinkedList } from './listdouble.js'
import * as memory from 'memory-cache'

type CallBackType = (e: AMessage, ...args: any[]) => Promise<any>

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

  #CallData: {
    [Event in (typeof EventEnum)[number]]?: CallBackType
  } = {}

  // 正则集
  #mergedRegexArr: RegExp[] = []
  // 大正则
  #regular: RegExp | null = null
  // 消息链表
  #list = new DoublyLinkedList<NodeDataType>()
  // 事件链表
  #elist = new DoublyLinkedList<NodeDataType>()

  /**
   * 创建应用
   * @param name 应用名
   */
  constructor(name: string) {
    this.#name = name
  }

  /**
   * 模糊信息查询节点
   * @param acount
   * @param example
   * @param func
   * @returns
   */
  findByKey(acount: number, example: string, func: string) {
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
   * list查询
   */
  find() {
    //
    const list = this.#list
    for (let i = 0; i < list.getSize(); i++) {
      const node = list.shift()
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
    const time = Date.now()
    // 执行
    const res = await this.#data[node.acount][node.example]
      [node.func](e, ...arr)
      .then(res => {
        console.info(this.info(e, node.func, time - Date.now()))
        return res
      })
      .catch(err => {
        console.error(this.err(e, node.func, time - Date.now()), err)
      })

    // 重执行
    if (res && typeof res != 'boolean') {
      await e.reply(res).catch(err => {
        console.error(this.err(e, node.func, time - Date.now()), err)
      })
    }
  }

  /**
   * 应用解析
   * @param e
   */
  async responseMessage(e: AMessage) {
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

    // 自动延长过期周期
    const CacheData: NodeDataType[] = memory.get(e.msg)
    if (CacheData) {
      for (const node of CacheData) {
        this.#data[node.acount][node.example].e = e
        const time = Date.now()
        // 执行
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            console.info(this.info(e, node.func, time - Date.now()))
            return res
          })
          .catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
            // 错误了就强制中断
          })
        // 重执行
        if (res && typeof res != 'boolean') {
          await e.reply(res).catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
          })
        }

        // 不是 false ,也就是不放行
        if (res != false) break
      }
      return
    }

    const cache: NodeDataType[] = []
    /**
     * *******
     * 走表
     * **********
     */
    for (let i = 0; i < list.getSize(); i++) {
      // 不断的取出索引
      const node = list.shift()
      // 索引匹配
      if (node.reg.test(e.msg)) {
        this.#data[node.acount][node.example].e = e
        const time = Date.now()
        // 执行
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            console.info(this.info(e, node.func, time - Date.now()))
            return res
          })
          .catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
            // 错误了就强制中断
          })
        // 重执行
        if (res && typeof res != 'boolean') {
          await e.reply(res).catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
          })
        }
        // 推送缓存
        cache.push(node)
        // 不是 false ,也就是不放行
        if (res != false) break
      }
    }

    /**
     * ********
     * 记录缓存
     * ********
     */
    if (cache.length != 0) {
      // 15分钟的缓存
      memory.put(e.msg, cache, 60 * 15)
    }

    return
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

    const key = `${e.event}:${e.typing}`

    // 自动延长过期周期
    const CacheData: NodeDataType[] = memory.get(key)
    if (CacheData) {
      for (const node of CacheData) {
        this.#data[node.acount][node.example].e = e
        const time = Date.now()
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            console.info(this.info(e, node.func, time - Date.now()))
            return res
          })
          .catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
          })
        if (res && typeof res != 'boolean') {
          await e.reply(res).catch(err => {
            console.error(this.err(e, node.func, time - Date.now()), err)
          })
        }
        // 不是 false ,也就是不放行
        if (res != false) break
      }
      return
    }

    const cache: NodeDataType[] = []

    /**
     * ******
     * *****
     */
    for (let i = 0; i < list.getSize(); i++) {
      const node = list.shift()
      // 类型不符
      if (node.event !== e.event || node.typing !== e.typing) continue
      //
      this.#data[node.acount][node.example].e = e
      const time = Date.now()
      const res = await this.#data[node.acount][node.example]
        [node.func](e, ...arr)
        .then(res => {
          console.info(this.info(e, node.func, time - Date.now()))
          return res
        })
        .catch(err => {
          console.error(this.err(e, node.func, time - Date.now()), err)
        })
      if (res && typeof res != 'boolean') {
        await e.reply(res).catch(err => {
          console.error(this.err(e, node.func, time - Date.now()), err)
        })
      }
      // 推送缓存
      cache.push(node)
      // 不是 false ,也就是不放行
      if (res != false) break
    }

    /**
     * ********
     * 记录缓存
     * ********
     */
    if (cache.length != 0) {
      // 15分钟的缓存
      memory.put(key, cache, 60 * 15)
    }

    return
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
        const priority = key['priority'] ?? 9000
        const node = {
          name: keys.name,
          acount: keys.acount,
          example: example,
          event: keys['event'],
          typing: keys['typing'],
          reg: /.*/,
          priority: priority,
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
          // 为空
          if (this.#list.isEmpty()) {
            this.#list.unshift(node)
          } else {
            // 比头部小
            if (priority <= this.#list.getHead().value.priority) {
              this.#list.unshift(node)
              continue
            } else if (priority >= this.#list.getTail().value.priority) {
              // 比尾部大
              this.#list.push(node)
              continue
            }
            this.#list.traverseAndInsert(node => priority < node.priority, node)
          }
          continue
        }
        // 为空
        if (this.#elist.isEmpty()) {
          this.#elist.unshift(node)
        } else {
          // 比头部小(同等级的放前面,损耗最小)
          if (priority <= this.#list.getHead().value.priority) {
            this.#list.unshift(node)
            continue
          } else if (priority >= this.#list.getTail().value.priority) {
            // 比尾部大(同等级的放后面,损耗最小)
            this.#list.push(node)
            continue
          }
          // 顺序插入
          this.#elist.traverseAndInsert(node => priority < node.priority, node)
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
    console.log('list', this.#list)
    AppMap.set(this.#name, this)
  }

  /**
   * 错误打印
   * @param data
   * @param funcName
   * @returns
   */
  err(e: AMessage, funcName: string, time: number) {
    return `[${e.event}] [${false}] [${funcName}] [${time}ms]`
  }

  /**
   * 自定义
   * @param data
   * @param funcName
   * @returns
   */
  info(e: AMessage, funcName: string, time: number) {
    return `[${e.event}] [${true}] [${funcName}] [${time}ms]`
  }

  /**
   * 响应消息类型
   * @param e
   */
  async response(e: AMessage, event: (typeof EventEnum)[number]) {
    if (this.#CallData[event]) {
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
      const FuncName = String(this.#CallData[event]['fnc']).match(
        /:\s*(\w+)\]/
      )[1]
      const time = Date.now()
      this.#CallData
        [event](e, ...arr)
        .then(res => {
          console.info(this.info(e, FuncName, time - Date.now()))
          return res
        })
        .catch(err => {
          console.error(this.err(e, FuncName, time - Date.now()), err)
        })
    }
    return false
  }

  /**
   * 监听系统
   * @param event 事件
   * @param call 回调
   * @param priority 优先级
   * @returns
   */
  on(event: (typeof EventEnum)[number], call: CallBackType) {
    const Event = event == 'message' ? 'MESSAGES' : event
    this.#CallData[Event] = call
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
