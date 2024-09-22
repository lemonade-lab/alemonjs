import { AEvents } from '../typing/typing'
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
  reg?: RegExp
) => any

type ResponseType = {
  platform?: string
  priority?: number
  enable?: boolean
  reg?: RegExp
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
) => any
