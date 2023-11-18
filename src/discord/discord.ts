import { IntentsEnum } from './sdk/index.js'
/**
 * ****
 * discord
 * ***
 */
export interface DISOCRDOptions {
  /**
   * 钥匙
   */
  token: string
  /**
   *
   */
  intent?: IntentsEnum[]
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
}
/**
 *
 */
export const defineDISCORD: DISOCRDOptions = {
  token: '',
  intent: [
    IntentsEnum.DIRECT_MESSAGES,
    IntentsEnum.DIRECT_MESSAGE_TYPING,
    IntentsEnum.DIRECT_MESSAGE_REACTIONS,
    IntentsEnum.GUILD_MESSAGE_TYPING,
    IntentsEnum.GUILD_MESSAGE_REACTIONS,
    IntentsEnum.GUILD_MESSAGES,
    IntentsEnum.GUILDS
  ],
  masterID: '',
  password: ''
}
