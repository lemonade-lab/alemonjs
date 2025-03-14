import { ChildrenCycle, Next } from '../cycle'
import { ClientAPI } from '../global'
import { Events } from './map'

export type Current<T extends keyof Events> = (event: Events[T], next: Next) => void

/**
 * 定义一个响应
 */
export type OnResponseType = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  callback: C,
  select: T | T[]
) => OnResponseValue<C, T>

export type OnResponseReversalType = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
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
export type OnMiddlewareType = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  callback: C,
  select: T | T[]
) => OnMiddlewareValue<C, T>

export type OnMiddlewareReversalType = <
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
export type DefineChildren = (
  callback: (() => ChildrenCycle) | ChildrenCycle
) => DefineChildrenValue
/**
 * 废弃
 * @deprecated
 */
export type DefineBotCallback = (() => Promise<ClientAPI> | ClientAPI) | ClientAPI
/**
 * 废弃
 * @deprecated
 */
export type DefineBotValue = {
  _name: 'platform'
  callback: DefineBotCallback
}
/**
 * 废弃
 * @deprecated
 */
export type DefineBot = (callback: DefineBotCallback) => DefineBotValue

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
export type DefinePlatform = (callback: DefinePlatformCallback) => DefinePlatformValue
