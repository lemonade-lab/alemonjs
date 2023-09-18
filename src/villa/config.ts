import { LoginByVillaConfig } from './types.js'
export const Login_villa = 'config/login-villa.yaml'
export const Login_Key = 'config/pub_key.txt'
/**
 * 机器人基础配置
 */
let cfg: LoginByVillaConfig = {
  bot_id: '',
  secret: '',
  pub_key: '',
  masterID: '',
  password: '',
  port: 8080,
  http: 'http',
  url: '/api/mys/callback',
  img_url: '/api/mys/img',
  IMAGE_DIR: 'data/mys/img',
  size: 999999
}

/**
 * 读取login配置
 * @returns
 */
export function getBotConfigByVilla() {
  return cfg
}
/**
 * 设置login配置
 * @param val
 * @returns
 */
export function setBotConfigByVilla(val: LoginByVillaConfig) {
  cfg = val
  return
}
