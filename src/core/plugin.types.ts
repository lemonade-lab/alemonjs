import { AMessage, EventEnum, TypingEnum } from './typings.js'

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
 * 插件类型
 */
export interface APluginInitType {
  event?: (typeof EventEnum)[number]
  typing?: (typeof TypingEnum)[number]
  priority?: number
  name?: string
  dsc?: string
  rule?: APluginRuleType[]
  /**
   * @deprecated 已废弃,建议使用原生模块 node-schedule
   */
  task?: APluginTaskType
}

export type fncAny = (
  e: AMessage,
  ...args: any[]
) => Promise<boolean | undefined | void>
type fncFinish = (type: string, isGroup?: boolean) => void
type fncReply = (
  content: string | number | Buffer | (string | number | Buffer)[],
  select?: { quote?: string; withdraw?: number }
) => Promise<any>
type fncGroup = (isGroup?: boolean) => string

export type APluginType =
  | string
  | number
  | fncAny
  | AMessage
  | APluginRuleType[]
  | APluginTaskType
  | fncFinish
  | fncReply
  | fncGroup
  | (typeof EventEnum)[number]
  | (typeof TypingEnum)[number]
