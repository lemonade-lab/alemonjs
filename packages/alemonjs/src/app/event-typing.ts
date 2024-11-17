import { AEvents } from '../env'
/**
 *
 */
type ControllerType = { next: Function; reg: RegExp }

/**
 *
 */
export type OnResponseType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: ControllerType) => any,
  select: T[] | T,
  reg?: T extends 'message.create' | 'private.message.create' ? RegExp : never
) => {
  callback: (event: AEvents[T], controller: ControllerType) => any
  select: T[] | T
  reg?: T extends 'message.create' | 'private.message.create' ? RegExp : never // 这里也使用条件类型
}

type ResponseType = {
  platform?: string
  priority?: number
  enable?: boolean
  reg?: RegExp
}

/**
 *
 */
export type OnMiddlewareType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: { next: Function }) => any,
  select: T | T[]
) => {
  callback: (event: AEvents[T], controller: { next: Function }) => any
  select: T | T[]
}

/**
 *
 */
export type ResponseConfigType = (options?: ResponseType) => ResponseType

/**
 *
 */
export type OnObserverType = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: ControllerType) => any,
  select: T | T[]
) => {
  callback: (event: AEvents[T], controller: ControllerType) => any
  select: T[] | T
}
