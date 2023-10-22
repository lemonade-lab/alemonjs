import { type ClientConfig } from './types.js'
/**
 * 配置
 */
let ClientCfg: ClientConfig = {
  bot_id: '',
  bot_secret: '',
  callback_url: '/api/mys/callback',
  callback_port: 8080,
  img_size: 9999999,
  img_url: '/api/mys/img',
  IMAGE_DIR: '/data/mys/img'
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
