import { Next } from '../cycle'
import { AEvents } from './map'

export type OnResponseValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], next: Next) => void
  select: T | T[]
}

/**
 * 定义一个响应
 */
export type OnResponseType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], next: Next) => void,
  select: T[] | T
) => OnResponseValue<T>

export type OnMiddlewareValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], next: Next) => void
  select: T | T[]
}

/**
 * 定义一个中间件
 */
export type OnMiddlewareType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], next: Next) => void,
  select: T | T[]
) => OnMiddlewareValue<T>

export type OnObserverValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], next: Next) => void
  select: T[] | T
}

/**
 * 定义一个观察者
 */
export type OnObserverType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], next: Next) => void,
  select: T | T[]
) => OnObserverValue<T>
