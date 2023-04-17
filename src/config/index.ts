/**
 * --------------------------
 * 这里是工程的固定配置文件
 * ----------------------
 */



/**
 *  plugin-config
 * 是插件的解构初始配置
 */
const Pcf = {
  name: 'your-name',
  dsc: 'undifind',
  //默认为私域
  event: 'GUILD_MESSAGES',
  // 私域且非测回消息
  eventType: 'MESSAGE_CREATE',
  priority: 5000,
  rule: <any>[]
}

/**
 * redis-config
 * 数据库初始配置
 */
const Rcf = {
  host: '127.0.0.1',
  port: 6379
}

/**
 * 机器人登录配置文件
 */

const Bcf = '/config/config.yaml'

const Dcf = '/src/config/config_default.yaml'

export { Pcf, Rcf, Bcf, Dcf }
