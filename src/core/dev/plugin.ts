import {
  APluginInitType,
  APluginRuleType,
  APluginTaskType
} from '../plugin/types.js'
import { type AMessage, type EventEnum, type TypingEnum } from '../typings.js'

import { APPS } from './application.js'

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
    Object.assign(this, init)
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
    const c = String(this).match(/(\w+)$/)[1] // 字符串化
    // 订阅消息
    APPS.addSubscribe(
      this.conKey(isGroup),
      setTimeout(() => {
        APPS.unsubscribe(this.conKey(isGroup), c, func)
        this.e.reply('操作超时已取消')
      }, time * 1000),
      c,
      func
    )
  }

  /**
   *
   * 得到用户缓存消息对象
   * @returns message
   */
  getContext() {
    //
  }

  /**
   * 得到频道缓存消息对象
   * @returns message
   */
  getContextGroup() {
    //
  }

  /**
   * 完成上下文
   * @param type 执行方法
   * @param isGroup 是否公信
   */
  finish(func: string, isGroup = false) {
    // 取消订阅
    APPS.unsubscribe(this.conKey(isGroup), String(this), func)
  }
}
export const plugin = APlugin
