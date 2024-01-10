import { APluginInitType, APluginRuleType, APluginTaskType } from './types.js'
import { type AEvent, type EventEnum, type TypingEnum } from '../typings.js'
import { ASubscribe } from './subscribe.js'

/**
 * alemonjs plugin
 * 插件标准类
 * @class
 */
export class APlugin {
  /**
   * this.e 方法
   */
  e: AEvent
  /**
   * 应用名
   */
  name?: string = 'alemonb'
  /**
   * 层级
   */
  acount?: number = 0
  /**
   * 实例名
   */
  example?: string = 'APlugin'
  /**
   * 事件枚举
   */
  event?: (typeof EventEnum)[number] = 'MESSAGES'
  /**
   * 事件类型
   */
  typing?: (typeof TypingEnum)[number] = 'CREATE'
  /**
   * 匹配优先级
   */
  priority?: number = 9000
  /**
   * 匹配集
   */
  rule?: APluginRuleType[] = []
  /**
   * @deprecated 已废弃,建议使用原生模块 node-schedule
   */
  task?: APluginTaskType
  /**
   * @param event 事件类型       default MESSAGES
   * @param typing 消息类型   default CREATE
   * @param priority 优先级      越小优越高 default 9000
   * @param rule.priority 优先级    数字越小优先级越高
   * @param rule.reg 命令正则    RegExp | string
   * @param rule.fnc 命令函数    function
   * @param rule.dsc 指令示范    sdc
   * @param rule.doc 指令文档    doc
   */
  constructor(init?: APluginInitType) {
    this.event = init?.event ?? 'MESSAGES'
    this.typing = init?.typing ?? 'CREATE'
    this.priority = init?.priority ?? 9000
    this.rule = init?.rule ?? []
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
    return this.e.reply(content, select)
  }

  /**
   * 得到缓存的key
   * @param isGroup
   * @returns key
   */
  conKey(isGroup = false) {
    // 应用名 频道号
    if (isGroup) return this.e.channel_id
    // 应用名 用户编号
    return this.e.user_id
  }

  /**
   * 设置上下文
   * @param func 执行方法
   * @param isGroup 是否群聊
   * @param time 操作时间，默认120秒
   */
  setContext(func: string, isGroup = false, time = 120) {
    // 订阅前确保前者删除
    ASubscribe.cancel(this.conKey(isGroup))
    // 订阅消息
    const con = ASubscribe.add(
      this.name,
      this.acount,
      this.example,
      func,
      this.conKey(isGroup),
      setTimeout(() => {
        const ron = ASubscribe.cancel(this.conKey(isGroup))
        // 定时取消成功
        if (ron) this.e.reply('操作已超时')
      }, time * 1000)
    )
    if (!con) this.e.reply('订阅错误')
  }

  /**
   *
   * 得到用户缓存消息对象
   * @returns message
   */
  getContext() {
    return ASubscribe.find(this.conKey())
  }

  /**
   * 得到频道缓存消息对象
   * @returns message
   */
  getContextGroup() {
    return ASubscribe.find(this.conKey(true))
  }

  /**
   * 完成上下文
   * @param type 执行方法
   * @param isGroup 是否公信
   */
  finish(func: string, isGroup = false) {
    // 取消订阅
    ASubscribe.cancel(this.conKey(isGroup))
  }
}
export const plugin = APlugin
