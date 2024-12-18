import { AEvents } from '../env'

export type OnResponseType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T[] | T
) => {
  current: (event: AEvents[T], controller: Function) => any
  select: T[] | T
}

type ResponseType = {
  platform?: string
  priority?: number
  enable?: boolean
  reg?: RegExp
}

export type OnMiddlewareType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T | T[]
) => {
  current: (event: AEvents[T], controller: Function) => any
  select: T | T[]
}

export type ResponseConfigType = (options?: ResponseType) => ResponseType

export type OnObserverType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: Function) => any,
  select: T | T[]
) => {
  current: (event: AEvents[T], controller: Function) => any
  select: T[] | T
}
