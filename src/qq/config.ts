import { LoginConfigByQQ } from './types.js'
export const Login_qq = 'config/login-qq.yaml'
/**
 *
 */
let cfg: LoginConfigByQQ = {
  appID: 'string',
  token: 'string',
  intents: [],
  isPrivate: false,
  sandbox: false,
  masterID: 'string',
  password: 'string'
}

/**
 * 得到机器人配置
 * @returns
 */
export function getBotConfigByQQ() {
  return cfg
}

/**
 * 设置机器人配置
 * @param val
 * @returns
 */
export function setBotConfigbyQQ(val: LoginConfigByQQ) {
  cfg = val
  return
}
