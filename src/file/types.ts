/**
 * 客户端配置
 */
export interface ServerOptions {
  /**
   * 协议
   */
  http?: string
  /**
   * 地址
   */
  ip?: string
  /**
   * 端口
   */
  port?: number
  /**
   * 地址路由
   */
  addressRouter?: string
  /**
   * 挂载路由
   */
  fileRouter?: string
  /**
   * 本地缓存地址
   */
  fileDir?: string
}
