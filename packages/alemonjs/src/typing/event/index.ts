import { ChildrenCycle, Next } from '../cycle'
import { ClientAPI } from '../client'
import { Events } from './map'
import { DataEnums } from '../message'

export type Current<T extends keyof Events> = (
  event: Events[T],
  next: Next
) =>
  | {
      /**
       * 是否允许分组，默认为 false
       */
      allowGrouping?: boolean
      /**
       * 要发送的数据
       */
      data?: DataEnums[]
      [key: string]: any
    }
  | boolean
  | DataEnums[]

/**
 * 定义一个响应
 */
export type OnResponseFunc = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  callback: C,
  select: T | T[]
) => OnResponseValue<C, T>

export type OnResponseReversalFunc = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  select: T | T[],
  callback: C
) => OnResponseValue<C, T>

// 返回值类型
export type OnResponseValue<C, T extends keyof Events> = {
  current: C // current 类型直接使用 callback 的类型
  select: T | T[]
}

/**
 * 定义一个中间件
 */
export type OnMiddlewareFunc = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  callback: C,
  select: T | T[]
) => OnMiddlewareValue<C, T>

export type OnMiddlewareReversalFunc = <
  T extends keyof Events,
  C extends Current<T> | Current<T>[]
>(
  select: T | T[],
  callback: C
) => OnMiddlewareValue<C, T>

export type OnMiddlewareValue<C, T extends keyof Events> = {
  current: C // current 类型直接使用 callback 的类型
  select: T | T[]
}

export type DefineChildrenCallback = (() => Promise<ChildrenCycle> | ChildrenCycle) | ChildrenCycle
export type DefineChildrenValue = {
  _name: 'apps'
  callback: DefineChildrenCallback
}
export type DefineChildrenFunc = (
  callback: (() => ChildrenCycle) | ChildrenCycle
) => DefineChildrenValue

/**
 * 定义一个平台
 */
export type DefinePlatformCallback = (() => Promise<ClientAPI> | ClientAPI) | ClientAPI
/**
 * 定义一个平台
 */
export type DefinePlatformValue = {
  _name: 'platform'
  callback: DefinePlatformCallback
}
/**
 * 定义一个平台
 */
export type DefinePlatformFunc = (callback: DefinePlatformCallback) => DefinePlatformValue

/**
 * 废弃，请使用 DefinePlatformCallback
 * @deprecated
 */
export type DefineBotCallback = DefinePlatformCallback
/**
 * 废弃，请使用 DefinePlatformValue
 * @deprecated
 */
export type DefineBotValue = DefinePlatformValue
/**
 * 废弃，请使用 DefinePlatform
 * @deprecated
 */
export type DefineBot = DefinePlatformFunc
