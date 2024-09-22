import { type EventFunctionMap, type AEvent } from '../typings.js'
import { type NodeDataType } from './types.js'
import { APlugin } from './plugin.js'
import { AppMap } from './data.js'
import { importPath } from './path.js'
import { DoublyLinkedList } from './listdouble.js'
import memory from 'memory-cache'
import { AInstruct } from './help.js'
import { AppLoadConfig } from './configs.js'
import { loger } from '../../log.js'

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

  #CallData: EventFunctionMap = {}

  // 正则集
  #mergedRegexArr: RegExp[] = []

  // 大正则
  #regular: RegExp | null = null

  // 消息链表
  #MessageList = new DoublyLinkedList<NodeDataType>()

  #MessageListArr: NodeDataType[] = []

  // 事件链表
  #EventList = new DoublyLinkedList<NodeDataType>()

  #EventListArr: NodeDataType[] = []

  /**
   * 创建应用
   * @param name 应用名
   */
  constructor(name: string) {
    this.#name = name
  }

  #infoFunc = (
    e: AEvent,
    name: string,
    acount: number,
    example: string,
    funcName: string
  ) => {
    return `[${e.event}] [${e.typing}] [${name}] [${acount}] [${example}] [${funcName}]`
  }

  #errorFunc = (
    e: AEvent,
    name: string,
    acount: number,
    example: string,
    funcName: string
  ) => {
    return `[${e.event}] [${e.typing}] [${name}] [${acount}] [${example}] [${funcName}]`
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
  find(acount: number, example: string, func: string) {
    for (const node of this.#MessageListArr) {
      if (
        node.acount == acount &&
        node.example == example &&
        node.func == func
      ) {
        return node
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
  async responseNode(e: AEvent, node: NodeDataType) {
    if (!e) return
    const time = Date.now()
    /**
     * **********
     * 构造配置
     * **********
     */
    const func = this.#dataMap.get('event')
    if (typeof func == 'function') e = await func(e)
    for (const item of this.#strArr) {
      e.msg = e.msg.replace(item.reg, item.str)
    }
    const argFunc = this.#dataMap.get('arg')
    let arr = []
    if (typeof argFunc == 'function') {
      arr = await argFunc(e)
    }
    this.#data[node.acount][node.example]['e'] = e
    // 执行
    this.#data[node.acount][node.example]
      [node.func](e, ...arr)
      .then(res => {
        if (res && typeof res != 'boolean') {
          e.reply(res)
        }
        loger.info(
          this.#infoFunc(e, node.name, node.acount, node.example, node.func),
          true,
          Date.now() - time
        )
        return res
      })
      .catch(err => {
        loger.error(
          this.#errorFunc(e, node.name, node.acount, node.example, node.func),
          false,
          Date.now() - time,
          err
        )
      })
  }

  /**
   * 应用解析
   * @param e
   */
  async responseMessage(e: AEvent) {
    // 空的
    if (this.#MessageList.isEmpty() || !e) return
    const time = Date.now()
    /**
     * **********
     * 构造配置
     * **********
     */
    const func = this.#dataMap.get('event')
    if (typeof func == 'function') e = await func(e)
    for (const item of this.#strArr) {
      e.msg = e.msg.replace(item.reg, item.str)
    }
    const argFunc = this.#dataMap.get('arg')
    let arr = []
    if (typeof argFunc == 'function') {
      arr = await argFunc(e)
    }

    const key = `${this.#name}:${e.msg}`

    /**
     * 选择性缓存
     * 带数字的消息都不会进入缓存
     * 因为数字多变  如 打开/宝箱1 213 购买51315 这个数字是多变的
     */

    // 自动延长过期周期
    const CacheData: NodeDataType[] = memory.get(key)

    if (CacheData) {
      for (const node of CacheData) {
        this.#data[node.acount][node.example]['e'] = e
        const time = Date.now()
        // 执行
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            if (res && typeof res != 'boolean') {
              e.reply(res)
            }
            loger.info(
              this.#infoFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              true,
              Date.now() - time
            )
            return res
          })
          .catch(err => {
            loger.error(
              this.#errorFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              false,
              Date.now() - time,
              err
            )
          })
        // 不是 false ,也就是不放行
        if (res != false) break
      }
      return
    }

    // 结点缓存
    const cache: NodeDataType[] = []

    /**
     * *******
     * 走表
     * **********
     */
    for (const node of this.#MessageListArr) {
      // 索引匹配
      if (node.reg.test(e.msg)) {
        this.#data[node.acount][node.example]['e'] = e
        // 执行
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            if (res && typeof res != 'boolean') {
              e.reply(res)
            }
            loger.info(
              this.#infoFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              true,
              Date.now() - time
            )
            return res
          })
          .catch(err => {
            loger.error(
              this.#errorFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              false,
              Date.now() - time,
              err
            )
            // 错误了就强制中断
          })
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
      // 5分钟的缓存
      memory.put(e.msg, cache, 5 * 60 * 1000)
    }

    return
  }

  /**
   * 响应消息类型
   * @param e
   */
  async responseEventType(e: AEvent) {
    // 空的
    if (this.#EventList.isEmpty() || !e) return

    const time = Date.now()

    /**
     * *****
     * ******
     */
    const func = this.#dataMap.get('event')
    if (typeof func == 'function') e = await func(e)
    for (const item of this.#strArr) {
      e.msg = e.msg.replace(item.reg, item.str)
    }
    const argFunc = this.#dataMap.get('arg')
    let arr = []
    if (typeof argFunc == 'function') {
      arr = await argFunc(e)
    }

    const key = `${this.#name}:${e.event}:${e.typing}`

    // 自动延长过期周期
    const CacheData: NodeDataType[] = memory.get(key)
    if (CacheData) {
      for (const node of CacheData) {
        this.#data[node.acount][node.example]['e'] = e
        const time = Date.now()
        const res = await this.#data[node.acount][node.example]
          [node.func](e, ...arr)
          .then(res => {
            loger.info(
              this.#infoFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              true,
              Date.now() - time
            )
            if (res && typeof res != 'boolean') {
              e.reply(res)
            }
            return res
          })
          .catch(err => {
            loger.error(
              this.#errorFunc(
                e,
                node.name,
                node.acount,
                node.example,
                node.func
              ),
              false,
              Date.now() - time,
              err
            )
          })

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
    for (const node of this.#EventListArr) {
      // 类型不符
      if (node.event !== e.event || node.typing !== e.typing) continue
      //
      this.#data[node.acount][node.example]['e'] = e
      const res = await this.#data[node.acount][node.example]
        [node.func](e, ...arr)
        .then(res => {
          if (res && typeof res != 'boolean') {
            e.reply(res)
          }
          loger.info(
            this.#infoFunc(e, node.name, node.acount, node.example, node.func),
            true,
            Date.now() - time
          )
          return res
        })
        .catch(err => {
          loger.error(
            this.#errorFunc(e, node.name, node.acount, node.example, node.func),
            false,
            Date.now() - time,
            err
          )
        })
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
  arg(fnc: (e: AEvent) => any[] | Promise<any[]>) {
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

  #AppData: { [key: string]: typeof APlugin } = {}
  #AppCount = 0

  /**
   *
   * @param plugin
   */
  use(plugin: typeof APlugin) {
    this.#AppCount++
    this.#AppData[`plugin_${this.#AppCount}`] = plugin
    return this
  }

  /**
   * 解析
   * @returns
   */
  chainUp() {
    return this
  }

  /**
   * 自定义
   * @param data
   * @param funcName
   * @returns
   */
  info(
    func: (
      e: AEvent,
      name: string,
      acount: number,
      example: string,
      funcName: string
    ) => string
  ) {
    this.#infoFunc = func
    return this
  }

  /**
   * 错误打印
   * @param data
   * @param funcName
   * @returns
   */
  error(
    func: (
      e: AEvent,
      name: string,
      acount: number,
      example: string,
      funcName: string
    ) => string
  ) {
    this.#errorFunc = func
    return this
  }

  /**
   * 响应回调
   * @param e
   */
  async response(e: AEvent) {
    const time = Date.now()
    if (this.#CallData[e.event]) {
      const func = this.#dataMap.get('event')
      if (typeof func == 'function') e = await func(e)
      for (const item of this.#strArr) {
        e.msg = e.msg.replace(item.reg, item.str)
      }
      const argFunc = this.#dataMap.get('arg')
      let arr = []
      if (typeof argFunc == 'function') {
        arr = await argFunc(e)
      }
      this.#CallData
        [e.event](e, ...arr)
        .then(res => {
          if (res && typeof res != 'boolean') {
            e.reply(res)
          }
          loger.info(
            this.#infoFunc(e, this.#name, 0, 'on', ''),
            true,
            Date.now() - time
          )
          return res
        })
        .catch(err => {
          loger.error(
            this.#infoFunc(e, this.#name, 0, 'on', ''),
            false,
            Date.now() - time,
            err
          )
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
  on(data: EventFunctionMap) {
    for (const key in data) {
      this.#CallData[key] = data[key]
    }
    return this
  }

  /**
   * 挂载
   */
  mount() {
    // 分配集合
    this.#data[this.#acount] = {}
    // 收集
    for (const example in this.#AppData) {
      const keys = new this.#AppData[example]()
      // 过滤事件
      const event = AppLoadConfig.get('event')
      //
      if (keys.event && event.includes(keys.event)) continue
      // name
      keys.name = this.#name
      // 层级
      keys.acount = this.#acount
      // 实例名
      keys.example = example
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
          if (this.#MessageList.isEmpty()) {
            this.#MessageList.unshift(node)
          } else {
            // 比头部小
            if (priority <= this.#MessageList.getHead().value.priority) {
              this.#MessageList.unshift(node)
              continue
            } else if (priority >= this.#MessageList.getTail().value.priority) {
              // 比尾部大
              this.#MessageList.push(node)
              continue
            }
            this.#MessageList.traverseAndInsert(
              node => priority < node.priority,
              node
            )
          }
          continue
        }
        // 为空
        if (this.#EventList.isEmpty()) {
          this.#EventList.unshift(node)
        } else {
          // 比头部小(同等级的放前面,损耗最小)
          if (priority <= this.#EventList.getHead().value.priority) {
            this.#EventList.unshift(node)
            continue
          } else if (priority >= this.#EventList.getTail().value.priority) {
            // 比尾部大(同等级的放后面,损耗最小)
            this.#EventList.push(node)
            continue
          }
          // 顺序插入
          this.#EventList.traverseAndInsert(
            node => priority < node.priority,
            node
          )
        }
        continue
      }
    }
    // 累计
    this.#acount++

    /**
     * *************
     * ************
     */

    // 构造大正则
    this.#regular = new RegExp(
      this.#mergedRegexArr.map(regex => regex.source).join('|')
    )
    // 数组化
    this.#EventListArr = this.#EventList.toArray()
    this.#MessageListArr = this.#MessageList.toArray()
    // 设置
    AppMap.set(this.#name, this)
    // 开发模式才生成
    if (process.env.ALEMONJS_JSON == 'dev') {
      // 生成json
      new AInstruct(this.#name).create(this.#MessageListArr)
    }
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
  return createSubApp(importPath(url).name())
}
