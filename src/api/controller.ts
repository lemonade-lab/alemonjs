import { Controller as villa } from '../villa/alemon/controller.js'
import { Controller as qq } from '../qq/alemon/controller.js'
import { Controller as ntqq } from '../ntqq/alemon/controller.js'
import { Controller as kook } from '../kook/alemon/controller.js'
import {
  type MessageControllerType,
  type MemberControllerType,
  type ControllerOption
} from '../core/index.js'

interface ControllerType {
  Message: any
  Member: any
}

interface ControllerMap {
  [key: string]: ControllerType
}

/**
 * 控制器管理
 */
export const CONTOLLER = new (class con {
  data: ControllerMap = { villa, qq, ntqq, kook }
  set(platform: string, val: ControllerType) {
    this.data[platform] = val
  }
  get(platform: string) {
    return this.data[platform]
  }
})()

/**
 * 控制器
 * @param platform
 * @returns
 */
export function Controller(platform: string) {
  /**
   * 选择器
   * @param options
   * @returns
   */
  return (
    options: ControllerOption
  ): {
    Message: MessageControllerType
    Member: MemberControllerType
  } => {
    return {
      Message: CONTOLLER.data[platform].Message(options as any),
      Member: CONTOLLER.data[platform].Member(options as any)
    }
  }
}
