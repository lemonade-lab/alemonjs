export interface LoginByVillaConfig {
  /**
   * bot
   */
  bot_id: string
  secret: string
  /**
   * master
   */
  masterID?: string
  password?: string
  /**
   * hppts
   */
  http?: string
  url?: string
  port?: number
  size?: number
  img_url?: string
  IMAGE_DIR?: string
}
