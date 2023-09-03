import { LoginConfigByDiscord } from './types.js'
export const login_dc = 'config/login-dc.yaml'
/**
 * 登录配置
 */
let cfg: LoginConfigByDiscord = {
  token: '',
  intents: [],
  masterID: '',
  password: ''
}

/**
 *
 * @param key
 * @returns
 */
export function getBotConfigByDiscord() {
  return cfg
}

/**
 *
 * @param val
 * @returns
 */
export function setBotConfigByDiscord(val: LoginConfigByDiscord) {
  cfg = val
  return
}
