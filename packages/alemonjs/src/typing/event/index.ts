import { Next } from '../cycle'
import { Events } from './map'

export type Current<T extends keyof Events> = (event: Events[T], next: Next) => void

/**
 * 定义一个响应
 */
export type OnResponseType = <T extends keyof Events, C extends Current<T> | Current<T>[]>(
  callback: C,
  select: T | T[]
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
export type OnMiddlewareValue<C, T extends keyof Events> = {
  current: C // current 类型直接使用 callback 的类型
  select: T | T[]
}
