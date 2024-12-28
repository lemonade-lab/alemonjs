import { Next } from '../cycle'
import { AEvents } from './map'

type Current<T extends keyof AEvents> = (event: AEvents[T], next: Next) => void

export type OnResponseType = <T extends keyof AEvents>(
  current: Current<T>,
  select: T[] | T
) => OnResponseValue<T>
export type OnResponseValue<T extends keyof AEvents> = {
  current: Current<T>
  select: T | T[]
}

/**
 * 定义一个中间件
 */
export type OnMiddlewareType = <T extends keyof AEvents>(
  current: Current<T>,
  select: T | T[]
) => OnMiddlewareValue<T>
export type OnMiddlewareValue<T extends keyof AEvents> = {
  current: Current<T>
  select: T | T[]
}

/**
 * 定义一个观察者
 */
export type OnObserverType = <T extends keyof AEvents>(
  current: Current<T>,
  select: T | T[]
) => OnObserverValue<T>
export type OnObserverValue<T extends keyof AEvents> = {
  current: Current<T>
  select: T[] | T
}
