import { PuppeteerLaunchOptions } from 'puppeteer'
import {
  KookOptionsg,
  NtQQOptions,
  QqGuildOptions,
  VillaOptions
} from '../default/types.js'
import { MysqlOptions, RedisOptions } from '../default/typings.js'
import { ServerOptions } from '../koa/types.js'

/**
 * ******
 * config
 * ******
 */
export interface ConfigType {
  redis: RedisOptions
  mysql: MysqlOptions
  kook: KookOptionsg
  villa: VillaOptions
  qq: QqGuildOptions
  server: ServerOptions
  puppeteer: PuppeteerLaunchOptions
  ntqq: NtQQOptions
}
