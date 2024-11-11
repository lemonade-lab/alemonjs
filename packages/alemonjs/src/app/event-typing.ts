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
  event: T,
  reg?: T extends 'message.create' | 'private.message.create' ? RegExp : never
) => {
  callback: (event: AEvents[T], controller: ControllerType) => any
  event: T
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
  event: T
) => {
  callback: (event: AEvents[T], controller: { next: Function }) => any
  event: T
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
  event: T,
  reg?: RegExp
) => { callback: (event: AEvents[T], controller: ControllerType) => any; event: T; reg?: RegExp }
