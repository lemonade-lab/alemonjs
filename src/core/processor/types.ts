/**
 * 索引节点
 */
export interface NodeDataType {
  /**
   * 应用归属
   */
  name: string
  /**
   * 集合id
   */
  acount: number
  /**
   * 实例名
   */
  example: string
  /**
   * 正则
   */
  reg: RegExp
  /**
   * 事件
   */
  event: string
  /**
   * 类型
   */
  typing: string
  /**
   * 优先级
   */
  priority: number
  /**
   * 方法
   */
  func: string
}

import { AMessage, EventEnum, TypingEnum } from '../typings.js'

/**
 * 定时类型
 */
export interface APluginTaskType {
  name?: string
  fnc?: string
  cron?: string
  log?: boolean
}

/**
 * 插件类型
 */
export interface APluginRuleType {
  /**
   * 优先级
   */
  priority?: number
  /**
   * 正则
   */
  reg?: RegExp | string
  /**
   * 方法(函数)
   */
  fnc: string | funcBase
  /**
   * 指令示范
   * @deprecated 已废弃
   */
  dsc?: string
  /**
   * 指令文档
   * @deprecated 已废弃
   */
  doc?: string
}

/**
 * 插件类型
 */
export interface APluginInitType {
  event?: (typeof EventEnum)[number]
  typing?: (typeof TypingEnum)[number]
  priority?: number
  rule?: APluginRuleType[]
  /**
   * @deprecated 已废弃
   */
  dsc?: string
  /**
   * @deprecated 已废弃,建议使用原生模块 node-schedule
   */
  task?: APluginTaskType
}

export type funcBase = (e: AMessage, ...args: any[]) => Promise<boolean | void>
