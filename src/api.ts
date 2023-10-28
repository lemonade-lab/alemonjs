/**
 * ***********
 * SDK接口管理
 * ***********
 */
import { IOpenAPI } from 'qq-guild-bot'
declare global {
  var ClientQQ: IOpenAPI
}
/**
 * qq客户端
 */
export const ClientQQ = global.ClientQQ
/**
 * villa客户端
 */
export { ClientVILLA } from './villa/sdk/index.js'
/**
 * ntqq客户端
 */
export { ClientNTQQ } from './ntqq/sdk/index.js'
/**
 * server客户端
 */
export { ClientKOA } from './koa/index.js'
/**
 * kook客户端
 */
export { ClientKOOK } from './kook/sdk/index.js'
