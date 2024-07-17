import { type EmailOptions } from '../email/types.js'
import { type FileOptions } from '../file/index.js'
import { type KOOKOptions } from '../platform/kook/sdk/wss.types.js'
import { type QQOptions } from '../platform/qq/sdk/wss.types.js'
import { type NTQQOptions } from '../platform/ntqq/sdk/wss.types.js'
import { type DISOCRDOptions } from '../platform/discord/sdk/wss.types.js'
/**
 * ******
 * config
 * ******
 */
export interface BotConfigType {
  [key: string]: any
  kook: KOOKOptions
  qq: QQOptions
  file: FileOptions
  ntqq: NTQQOptions
  discord: DISOCRDOptions
  email: EmailOptions
}
