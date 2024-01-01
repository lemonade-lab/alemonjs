import { Controller as villaController } from '../villa/alemon/controller.js'
import { Controller as qqController } from '../qq/alemon/controller.js'
import { Controller as ntqqController } from '../ntqq/alemon/group/controller.js'
import { Controller as kookController } from '../kook/alemon/controller.js'
import {
  type MessageControllerType,
  type MemberControllerType,
  type ControllerOption
} from '../core/index.js'
/**
 * 控制器管理
 */
export const CONTOLLER = new (class con {
  data: {
    [key: string]: {
      Message: any
      Member: any
    }
  } = {
    villa: villaController,
    qq: qqController,
    ntqq: ntqqController,
    kook: kookController
  }
  set(
    platform: string,
    val: {
      Message: any
      Member: any
    }
  ) {
    this.data[platform] = val
  }
  get(platform: string) {
    return this.data[platform]
  }
})()
/**
 * 私有
 * @param platform
 * @deprecated 已废弃
 */
export const setControlller = CONTOLLER.set
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
