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

/**
 * 控制器
 * @param options
 * @returns
 */
export const Controller = (options: {
  platform: (typeof PlatformEnum)[number]
  guild_id?: string
  channel_id?: string
  msg_id?: string
  send_at?: number
}) => {
  const map: {
    [Event in (typeof PlatformEnum)[number]]: {
      Message: MessageControllerType
    }
  } = {
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
  return map[options.platform]
}
