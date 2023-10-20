import { type BotConfig } from './typings.js'
let cfg: BotConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: []
}
/**
 * 得到机器人配置
 * @returns
 */
export function getBotConfig() {
  return cfg
}
/**
 * 设置机器人配置
 * @param val
 * @returns
 */
export function setBotNTQQConfig(val: BotConfig) {
  cfg = val
  return
}

import { type WebConfig } from './types.js'
/**
 * 配置
 */
let ClientCfg: WebConfig = {
  callback_port: 9090,
  img_size: 9999999,
  http: 'http',
  img_url: '/api/mys/img',
  IMAGE_DIR: '/data/mys/img'
}
/**
 * 设置配置
 * @param cfg
 */
export function setWebConfig(cfg: WebConfig) {
  ClientCfg = cfg
}
/**
 * 得到配置
 * @returns
 */
export function getWebConfig() {
  return ClientCfg
}
