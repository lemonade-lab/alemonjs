import { LoginConfigByQQRroup } from './types.js'
export const login_qqgroup = 'config/login-qqgroup.yaml'
let cfg: LoginConfigByQQRroup = {
  account: 0,
  password: '',
  masterID: 0,
  masterPW: '',
  device: 1,
  friendApplication: false,
  groupInvitation: false,
  addGroupApplication: false
}

/**
 *
 * @returns
 */
export function getBotConfigQQGroup() {
  return cfg
}

/**
 *
 * @param val
 * @returns
 */
export function setBotConfigQQGroup(val: LoginConfigByQQRroup) {
  cfg = val
  return
}
