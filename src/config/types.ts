import { type PuppeteerLaunchOptions } from 'puppeteer'
import { type MysqlOptions, type RedisOptions } from '../default/types.js'
import { type ServerOptions } from '../koa/types.js'
import { type KOOKOptions } from '../kook/kook.js'
import { type VILLAOptions } from '../villa/villa.js'
import { type QQOptions } from '../qq/qq.js'
import { type NTQQOptions } from '../ntqq/ntqq.js'
import { type OneOptions } from '../one/one.js'
import { type DISOCRDOptions } from '../discord/discord.js'
/**
 * ******
 * config
 * ******
 */
export interface ConfigType {
  redis: RedisOptions
  mysql: MysqlOptions
  kook: KOOKOptions
  villa: VILLAOptions
  qq: QQOptions
  server: ServerOptions
  puppeteer: PuppeteerLaunchOptions
  ntqq: NTQQOptions
  one: OneOptions
  discord: DISOCRDOptions
}
