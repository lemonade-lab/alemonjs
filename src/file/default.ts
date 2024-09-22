import { FileOptions } from './types.js'
export const DefaultFileOptions: FileOptions = {
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
   * 挂载路由
   */
  fileRouter: '/api/alemonjs/file',
  /**
   * 地址
   */
  addressRouter: '/api/alemonjs/local',
  /**
   * 本地缓存地址
   */
  fileDir: '/data/alemonjs/img'
}
