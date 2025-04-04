import { DCIntentsEnum } from './types.js'

/**
 * ****
 * discord
 * ***
 */
export interface DISOCRDOptions {
  /**
   * 网关地址
   */
  gatewayURL?: string
  /**
   * 钥匙
   */
  token: string
  /**
   * 订阅(有默认值)
   * ******
   */
  intent?: DCIntentsEnum[]
  /**
   * 分片(有默认值)
   * ******
   * [0, 1]
   */
  shard?: number[]
}
