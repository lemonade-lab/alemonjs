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
   * 别野
   */
  villa_id: number
}

export const defineVILLA = {
  bot_id: '',
  secret: '',
  pub_key: '',
  masterID: '',
  villa_id: 0
}
