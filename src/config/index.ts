import { getYaml } from 'alemon'
import { join } from 'path'
import { existsSync, cpSync } from 'fs'
export const DefaultConfigLogin = 'config_default/login.yaml'
export const DefaultConfigRedis = 'config_default/redis.yaml'
export const DefaultConfigPuppeteer = 'config_default/puppeteer.yaml'
export const ConfigLogin = 'config/login.yaml'
export const ConfigRedis = 'config/redis.yaml'
export const ConfigPuppeteer = 'config/puppeteer.yaml'
/** redis  */
if (existsSync(DefaultConfigRedis) && !existsSync(ConfigRedis)) {
  cpSync(DefaultConfigRedis, ConfigRedis, {
    recursive: true
  })
}
/** puppeterr */
if (existsSync(DefaultConfigPuppeteer) && !existsSync(ConfigPuppeteer)) {
  cpSync(DefaultConfigPuppeteer, ConfigPuppeteer, {
    recursive: true
  })
}
/** 读取配置 */
const RedisConfig: any = getYaml(join(process.cwd(), ConfigRedis))
const PuppeteerConfig: any = getYaml(join(process.cwd(), ConfigPuppeteer))
export { RedisConfig, PuppeteerConfig }
