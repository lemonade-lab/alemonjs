import {
  ClientQQ,
  ClientVILLA,
  ClientNTQQ,
  ClientKOA,
  ClientKOOK,
  ClientDISOCRD
} from './api/index.js'

const CLIENT = {
  qq: ClientQQ,
  villa: ClientVILLA,
  ntqq: ClientNTQQ,
  koa: ClientKOA,
  kook: ClientKOOK,
  discord: ClientDISOCRD
}
/**
 * 得到指定平台客户端
 * @param platform
 * @returns
 */
export function getClient(platform: string) {
  return CLIENT[platform]
}
