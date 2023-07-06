import { getYaml } from 'alemon'
import { join, dirname } from 'path'
import { existsSync, cpSync } from 'fs'
import { fileURLToPath } from 'url'
const filename = fileURLToPath(import.meta.url)
const __dirname = dirname(filename)
export const DefaultConfigLogin = join(__dirname, '../default/login.yaml')
export const DefaultConfigRedis = join(__dirname, '../default/redis.yaml')
export const DefaultConfigMysql = join(__dirname, '../default/mysql.yaml')
export const DefaultConfigPuppeteer = join(__dirname, '../default/puppeteer.yaml')
export const DefaultConfigMys = join(__dirname, '../default/mys.yaml')
export const ConfigLogin = 'config/login.yaml'
export const ConfigRedis = 'config/redis.yaml'
export const ConfigMysql = 'config/mysql.yaml'
export const ConfigPuppeteer = 'config/puppeteer.yaml'
export const ConfigMys = 'config/mys.yaml'
/** redis */
if (existsSync(DefaultConfigRedis) && !existsSync(ConfigRedis)) {
  cpSync(DefaultConfigRedis, ConfigRedis, {
    recursive: true
  })
}
/** mysql */
if (existsSync(DefaultConfigMysql) && !existsSync(ConfigMysql)) {
  cpSync(DefaultConfigMysql, ConfigMysql, {
    recursive: true
  })
}
/** puppeterr */
if (existsSync(DefaultConfigPuppeteer) && !existsSync(ConfigPuppeteer)) {
  cpSync(DefaultConfigPuppeteer, ConfigPuppeteer, {
    recursive: true
  })
}
/* mys */
if (existsSync(DefaultConfigMys) && !existsSync(ConfigMys)) {
  cpSync(DefaultConfigMys, ConfigMys, {
    recursive: true
  })
}
/* 读取配置 */
const PuppeteerConfig = getYaml(join(process.cwd(), ConfigPuppeteer))
const MysConfig = getYaml(join(process.cwd(), ConfigMys))
export { PuppeteerConfig, MysConfig }
