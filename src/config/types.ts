import { type PuppeteerLaunchOptions } from 'puppeteer'
import { type MysqlOptions, type RedisOptions } from '../default/index.js'
import { type ServerOptions } from '../koa/types.js'
import { type KOOKOptions } from '../kook/sdk/ws.js'
import { type VILLAOptions } from '../villa/sdk/wss.js'
import { type QQOptions } from '../qq/sdk/wss.js'
import { type NTQQOptions } from '../ntqq/sdk/wss.js'
import { type DISOCRDOptions } from '../discord/sdk/wss.js'
/**
 * ******
 * config
 * ******
 */
export interface BotConfigType {
  [key: string]: any
  redis: RedisOptions
  mysql: MysqlOptions
  kook: KOOKOptions
  villa: VILLAOptions
  qq: QQOptions
  server: ServerOptions
  puppeteer: PuppeteerLaunchOptions
  ntqq: NTQQOptions
  discord: DISOCRDOptions
}
