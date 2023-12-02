import { type ClientConfig } from './types.js'
/**
 * 配置
 */
let ClientCfg: ClientConfig = {
  bot_id: '',
  bot_secret: '',
  pub_key: '',
  villa_id: 0,
  token: ''
}
/**
 * 设置配置
 * @param cfg
 */
export function setClientConfig(cfg: ClientConfig) {
  ClientCfg = cfg
}
/**
 * 得到配置
 * @returns
 */
export function getClientConfig() {
  return ClientCfg
}
