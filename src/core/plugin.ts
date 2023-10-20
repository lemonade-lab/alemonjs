import { type AMessage, type EventEnum, type EventType } from './typings.js'

/**
 * 状态缓存
 */
const stateCache = {}

/**
 * 插件类型
 */
export interface PluginInitType {
  event?: (typeof EventEnum)[number]
  eventType?: (typeof EventType)[number]
  priority?: number
  name?: string
  dsc?: string
  rule?: PluginRuleType[]
  task?: {
    name: string
    fnc: string
    cron: string
  }
}
/**
 * 插件类型
 */
export interface PluginRuleType {
  /**
   * 正则
   */
  reg?: RegExp | string
  /**
   * 方法(函数)
   */
  fnc: string
  /**
   * 指令示范
   */
  dsc?: string
  /**
   * 指令文档
   */
  doc?: string
  /**
   * 优先级
   */
  priority?: number
}

/**
 * 插件模板
 */
export class plugin {
  /**
   * this.e 方法
   */
  e: AMessage
  /**
   * 模块名
   */
  name?: string
  /**
   * 模块说明
   */
  dsc?: string
  /**
   * 事件枚举
   */
  event?: (typeof EventEnum)[number]
  /**
   * 事件类型
   */
  eventType?: (typeof EventType)[number]
  /**
   * 匹配优先级
   */
  priority?: number
  /**
   * 匹配集
   */
  rule?: PluginRuleType[]

  task?: {
    name: string
    fnc: string
    cron: string
  }

  /**
   * @param name 类名标记        default app-name
   * @param event 事件类型       default MESSAGES
   * @param eventType 消息类型   default CREATE
   * @param priority 优先级      越小优越高 default 9000
   * @param rule.reg 命令正则    RegExp | string
   * @param rule.fnc 命令函数    function
   * @param rule.dsc 指令示范    sdc
   * @param rule.doc 指令文档    doc
   * @param rule.priority 优先级    数字越小优先级越高
   */
  constructor({
    name = 'app-name',
    event = 'MESSAGES',
    eventType = 'CREATE',
    priority = 9000,
    rule = [],
    task
  }: PluginInitType) {
    this.name = name
    this.event = event
    this.eventType = eventType
    this.priority = priority
    this.rule = rule
    this.task = {
      name: task?.fnc ?? '',
      fnc: task?.fnc ?? '',
      cron: task?.cron ?? ''
    }
  }

  /**
   * @param content 内容
   * @param img  图片buffer | 指定图片名
   * @param name 指定图片名
   * @returns
   */
  reply(
    content?: string | Buffer | string[],
    img?: string | Buffer,
    name?: string
  ) {
    if (!this.e.reply || !content || content == '') return false
    this.e.reply(content, img, name)
    return true
  }

  /**
   * 缓存key
   * @param isGroup
   * @returns
   */
  conKey(isGroup = false) {
    if (isGroup) {
      return `${this.name}.${this.e.guild_id}`
    } else {
      return `${this.name}.${this.e.user_id}`
    }
  }

  /**
   * @param type 执行方法
   * @param isGroup 是否群聊
   * @param time 操作时间，默认120秒
   */
  setContext(type: string, isGroup = false, time = 120) {
    const key = this.conKey(isGroup)
    if (!stateCache[key]) stateCache[key] = {}
    stateCache[key][type] = this.e
    if (time && typeof time == 'number') {
      /** 操作时间 */
      setTimeout(() => {
        if (stateCache[key][type]) {
          delete stateCache[key][type]
          this.e.reply('操作超时已取消')
        }
      }, time * 1000)
    }
  }

  /**
   *
   * @returns
   */
  getContext() {
    const key = this.conKey()
    return stateCache[key]
  }

  /**
   *
   * @returns
   */
  getContextGroup() {
    const key = this.conKey(true)
    return stateCache[key]
  }

  /**
   * @param type 执行方法
   * @param isGroup 是否公信
   */
  finish(type: string, isGroup = false) {
    if (
      stateCache[this.conKey(isGroup)] &&
      stateCache[this.conKey(isGroup)][type]
    ) {
      delete stateCache[this.conKey(isGroup)][type]
    }
  }
}
