import { LoginConfigByKOOK } from './types.js'
export const Login_kook = 'config/login-kook.yaml'
/**
 * 机器人配置
 */
let cfg: LoginConfigByKOOK = {
  token: '',
  masterID: '',
  password: ''
}

/**
 *
 * @returns
 */
export function getBotConfigByKOOK() {
  return cfg
}

/**
 *
 * @param val
 * @returns
 */
export function setBotConfigByKOOK(val: LoginConfigByKOOK) {
  cfg = val
  return
}
