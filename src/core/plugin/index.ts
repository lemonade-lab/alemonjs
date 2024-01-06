import { APluginInitType, APluginRuleType, APluginTaskType } from './types.js'
import { type AMessage, type EventEnum, type TypingEnum } from '../typings.js'
const cache = {
  state: {},
  timeout: {}
}
/**
 * alemonjs plugin
 * 插件标准类
 * @class
 */
export class APlugin {
  /**
   * this.e 方法
   */
  e: AMessage
  /**
   * 模块名
   */
  name?: string = 'alemonb'
  /**
   * 层级
   */
  acount?: number = 0
  /**
   * 事件枚举
   */
  event?: (typeof EventEnum)[number]
  /**
   * 事件类型
   */
  typing?: (typeof TypingEnum)[number]
  /**
   * 匹配优先级
   */
  priority?: number
  /**
   * 匹配集
   */
  rule?: APluginRuleType[]
  /**
   * @deprecated 已废弃,建议使用原生模块 node-schedule
   */
  task?: APluginTaskType

  /**
   * @param name 类名标记        default app-name
   * @param event 事件类型       default MESSAGES
   * @param typing 消息类型   default CREATE
   * @param priority 优先级      越小优越高 default 9000
   * @param rule.reg 命令正则    RegExp | string
   * @param rule.fnc 命令函数    function
   * @param rule.dsc 指令示范    sdc
   * @param rule.doc 指令文档    doc
   * @param rule.priority 优先级    数字越小优先级越高
   */
  constructor(init?: APluginInitType) {
    this.priority = init.priority ?? 9000
    this.event = init.event ?? 'MESSAGES'
    this.typing = init.typing ?? 'CREATE'
    this.rule = init.rule ?? []
  }

  /**
   * @param content 内容
   * @param img  图片buffer | 指定图片名
   * @param name 指定图片名
   * @returns 是否处理完成
   */
  async reply(
    content: Buffer | string | number | (Buffer | number | string)[],
    select?: {
      quote?: string
      withdraw?: number
    }
  ) {
    if (!this.e.reply || !content || content == '') return false
    return await this.e.reply(content, select)
  }

  /**
   * 得到缓存的key
   * @param isGroup
   * @returns key
   */
  conKey(isGroup = false) {
    // 应用名 频道号
    if (isGroup)
      return `${JSON.stringify(this.rule)}:${this.name}:${this.e.guild_id}`
    // 应用名 用户编号
    return `${JSON.stringify(this.rule)}:${this.name}:${this.e.user_id}`
  }

  /**
   * 设置上下文
   * @param type 执行方法
   * @param isGroup 是否群聊
   * @param time 操作时间，默认120秒
   */
  setContext(type: string, isGroup = false, time = 120) {
    // 得到缓存key
    const key = this.conKey(isGroup)
    // 不存在
    if (!cache.state[key]) cache.state[key] = {}
    cache.state[key][type] = this.e
    // 定时
    if (!(time && typeof time == 'number')) return
    //
    if (!cache.timeout[key]) cache.timeout[key] = {}
    //
    cache.timeout[key][type] = setTimeout(() => {
      this.finish(type, isGroup)
      this.e.reply('操作超时已取消')
    }, time * 1000)
  }

  /**
   *
   * 得到用户缓存消息对象
   * @returns message
   */
  getContext() {
    return cache.state[this.conKey()]
  }

  /**
   * 得到频道缓存消息对象
   * @returns message
   */
  getContextGroup() {
    return cache.state[this.conKey(true)]
  }

  /**
   * 完成上下文
   * @param type 执行方法
   * @param isGroup 是否公信
   */
  finish(type: string, isGroup = false) {
    if (!this.conKey(isGroup)) return
    if (
      // 检擦key
      cache.state[this.conKey(isGroup)] &&
      // 检查方法
      cache.state[this.conKey(isGroup)][type]
    ) {
      // 删除方法
      delete cache.state[this.conKey(isGroup)][type]
    }
    if (
      // 检擦key
      cache.timeout[this.conKey(isGroup)] &&
      // 检查方法
      cache.timeout[this.conKey(isGroup)][type]
    ) {
      /**
       * 删除定时任务
       */
      clearTimeout(cache.timeout[this.conKey(isGroup)][type])
    }
  }
}
export const plugin = APlugin
