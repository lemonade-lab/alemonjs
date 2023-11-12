import { PuppeteerLaunchOptions } from 'puppeteer'
import { MysqlOptions, RedisOptions } from '../default/types.js'
import { ServerOptions } from '../koa/types.js'
import { KOOKOptions } from '../kook/kook.js'
import { VILLAOptions } from '../villa/villa.js'
import { QQOptions } from '../qq/qq.js'
import { NTQQOptions } from '../ntqq/ntqq.js'
import { OneOptions } from '../one/one.js'
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
}
