import { AEvents } from './map'

export type OnResponseValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], controller: Function) => any
  select: T | T[]
}

export type OnResponseType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T[] | T
) => OnResponseValue<T>

export type OnMiddlewareValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], controller: Function) => any
  select: T | T[]
}

export type OnMiddlewareType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T | T[]
) => OnMiddlewareValue<T>

export type OnObserverValue<T extends keyof AEvents> = {
  current: (event: AEvents[T], controller: Function) => any
  select: T[] | T
}

export type OnObserverType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T | T[]
) => OnObserverValue<T>
