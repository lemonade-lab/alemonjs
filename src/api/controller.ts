import { Controller as villaController } from '../villa/alemon/controller.js'
import { Controller as qqController } from '../qq/alemon/controller.js'
import { Controller as ntqqController } from '../ntqq/alemon/group/controller.js'
import { Controller as kookController } from '../kook/alemon/controller.js'
import {
  type MessageControllerType,
  type MemberControllerType,
  type ControllerOption
} from '../core/index.js'

const map: {
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

/**
 * 私有
 * @param platform
 */
export function setControlller(
  platform: string,
  val: {
    Message: any
    Member: any
  }
) {
  map[platform] = val
}

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
      Message: map[platform].Message(options as any),
      Member: map[platform].Member(options as any)
    }
  }
}
