/**
 * ***********
 * SDK接口管理
 * ***********
 */
import { IOpenAPI } from 'qq-guild-bot'
import { ClientAPIByQQ as ClientByNTQQ } from './ntqq/sdk/index.js'
import { Client as ClientByVILLA } from './villa/sdk/index.js'
import { KOOKApiClient as ClientByKOOK } from './kook/sdk/index.js'
import { ClientKOA as ClientByKOA } from './koa/index.js'
declare global {
  var clientApiByQQ: IOpenAPI
}
/**
 * qq客户端
 */
export const ClientQQ = global.ClientAPIByQQ
/**
 * kook客户端
 */
export const ClientKOOK = ClientByKOOK
/**
 * ntqq客户端
 */
export const ClientNTQQ = ClientByNTQQ
/**
 * villa客户端
 */
export const ClientVILLA = ClientByVILLA
/**
 * server客户端
 */
export const ClientKOA = ClientByKOA
