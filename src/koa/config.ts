import { ServerOptions } from './types.js'
/**
 * 服务配置
 */
const ServerCfg: ServerOptions = {
  /**
   * 协议
   */
  http: 'http',
  /**
   * 端口
   */
  port: 6060,
  /**
   * 地址
   */
  ip: 'localhost',
  /**
   * 图片随机度
   */
  imgSize: 9999999,
  /**
   * 挂载路由
   */
  imgRouter: '/api/alemonjs/img',
  /**
   * 本地缓存地址
   */
  imgDir: '/data/alemonjs/img'
}

/**
 * @param key 配置名
 * @param val 配置值
 */
export function setServerCoinfg<T extends keyof ServerOptions>(
  key: T,
  val: ServerOptions[T]
): void {
  if (Object.prototype.hasOwnProperty.call(ServerCfg, key)) {
    ServerCfg[key] = val
  }
}

/**
 * @param key 配置名
 * @returns 得到配置值
 */
export function getServerConfig<T extends keyof ServerOptions>(
  key: T
): ServerOptions[T] | undefined {
  return ServerCfg[key]
}
