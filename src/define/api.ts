/**
 * ***********
 * SDK接口管理
 * ***********
 */
import { IOpenAPI } from 'qq-guild-bot'
import { ClientAPIByQQ as ClientByNTQQ } from '../ntqq/sdk/index.js'
import { Client as ClientByVILLA } from 'mys-villa'
import { KOOKApiClient as ClientByKOOK } from 'kook-ws'
declare global {
  var clientApiByQQ: IOpenAPI
}
/**
 * discord客户端
 */
export const ClientDISCORD = {}
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
