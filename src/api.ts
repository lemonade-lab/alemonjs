/**
 * ***********
 * SDK接口管理
 * ***********
 */
export { ClientQQ } from './qq/index.js'
/**
 * villa客户端
 */
export { ClientVILLA } from './villa/index.js'
/**
 * ntqq客户端
 */
export { ClientNTQQ } from './ntqq/index.js'
/**
 * server客户端
 */
export { ClientKOA } from './koa/index.js'
/**
 * kook客户端
 */
export { ClientKOOK } from './kook/index.js'
/**
 * one客户端
 */
export { ClientONE } from './one/index.js'

/**
 * 控制器
 */
import { Controller as villaController } from './villa/alemon/controller.js'
import { Controller as qqController } from './qq/alemon/controller.js'
import { Controller as ntqqController } from './ntqq/alemon/controller.js'
import { Controller as kookController } from './kook/alemon/controller.js'
import { Controller as oneController } from './one/alemon/controller.js'
import { type MessageControllerType } from './core/index.js'

// 当前可用平台
const PlatformEnum = ['villa', 'qq', 'kook', 'ntqq', 'one'] as const

interface OptionType {
  /**
   * 频道号
   */
  guild_id?: string
  /**
   * 子频道号
   */
  channel_id?: string
  /**
   * 消息编号
   */
  msg_id?: string
  /**
   * 消息创建时间
   */
  send_at?: number
}

/**
 * 控制器
 * @param platform
 * @returns
 */
export const Controller = (platform: (typeof PlatformEnum)[number]) => {
  /**
   * 选择器
   * @param options
   * @returns
   */
  const fnc = (
    options: OptionType
  ): {
    Message: MessageControllerType
  } => {
    const map = {
      villa: {
        Message: villaController.Message(options as any)
      },
      qq: {
        Message: qqController.Message(options as any)
      },
      ntqq: {
        Message: ntqqController.Message(options as any)
      },
      kook: {
        Message: kookController.Message(options as any)
      },
      one: {
        Message: oneController.Message(options as any)
      }
    }
    return map[platform]
  }
  return fnc
}
