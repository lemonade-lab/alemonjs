/**
 * ****
 * villa
 * *****
 */
export interface VILLAOptions {
  /**
   * 机器人编号
   */
  bot_id: string
  /**
   * 密钥
   */
  secret: string
  /**
   * 公匙
   */
  pub_key: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
  /**
   * 回调地址
   */
  url?: string
  /**
   * 端口
   */
  port?: number
  /**
   * 随机数大小
   */
  size?: number
  /**
   * 图片路由
   */
  img_url?: string
  /**
   * 本地缓存图地址
   */
  IMAGE_DIR?: string
  /**
   * 头模式
   */
  http?: string
}

export const defineVILLA = {
  bot_id: '',
  secret: '',
  pub_key: '',
  masterID: '',
  password: '',
  http: 'http',
  url: '/api/mys/callback',
  port: 8080,
  size: 999999,
  img_url: '/api/mys/img',
  IMAGE_DIR: '/data/mys/img'
}
