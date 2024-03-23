import { type PuppeteerLaunchOptions } from 'puppeteer'
import { type EmailOptions } from '../email/types.js'
import { type FileOptions } from '../file/index.js'
import { type KOOKOptions } from '../platform/kook/sdk/wss.js'
import { type QQOptions } from '../platform/qq/sdk/wss.js'
import { type NTQQOptions } from '../platform/ntqq/sdk/wss.js'
import { type DISOCRDOptions } from '../platform/discord/sdk/wss.js'
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
  puppeteer: PuppeteerLaunchOptions
  ntqq: NTQQOptions
  discord: DISOCRDOptions
  email: EmailOptions
}
