/** 数据库初始配置 */
const Rcf = {
  host: '127.0.0.1',
  port: 6379
}

/** 机器人登录配置文件 */
const Bcf = '/config/config.yaml'
/** 机器人登录配置文件 */
const Dcf = '/src/config/config_default.yaml'

/** 环境配置 */
const Acf = {
  sandbox_api: 'https://sandbox.api.sgroup.qq.com',
  api: 'https://api.sgroup.qq.com'
}

/* 浏览器配置 */
const PuPcf = {
  //浏览器路径
  chromePath: ''
}

export { Rcf, Bcf, Dcf, Acf, PuPcf }
