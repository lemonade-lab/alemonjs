import { ClientConfig } from './types.js'
/** 配置 */
const ClientCfg: ClientConfig = {
  bot_id: '',
  bot_secret: '',
  callback_url: '',
  callback_host: 0,
  img_rul: '',
  IMAGE_DIR: ''
}
export function setClientConfig(cfg: ClientConfig) {
  ClientCfg.bot_id = cfg.bot_id
  ClientCfg.bot_secret = cfg.bot_secret
  ClientCfg.callback_url = cfg.callback_url
  ClientCfg.callback_host = cfg.callback_host
  ClientCfg.img_rul = cfg.img_rul
  ClientCfg.IMAGE_DIR = cfg.IMAGE_DIR
}
export function getClientConfig() {
  return ClientCfg
}
