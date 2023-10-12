import { PuppeteerLaunchOptions } from 'puppeteer'
import {
  DiscordOptions,
  KookOptionsg,
  MysqlOptions,
  NtQQOptions,
  QqGuildOptions,
  RedisOptions,
  VillaOptions,
  ServerOptions
} from '../default/types.js'

/**
 * ******
 * config
 * ******
 */
export interface ConfigType {
  redis: RedisOptions
  mysql: MysqlOptions
  discord: DiscordOptions
  kook: KookOptionsg
  villa: VillaOptions
  qq: QqGuildOptions
  server: ServerOptions
  puppeteer: PuppeteerLaunchOptions
  ntqq: NtQQOptions
}
