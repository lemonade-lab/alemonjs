import { ConfigType } from './types.js'
import redis from '../default/redis.js'
import mysql from '../default/mysql.js'
import server from '../default/server.js'
import puppeteer from '../default/pup.js'
import discord from '../discord/discord.js'
import kook from '../kook/kook.js'
import villa from '../villa/villa.js'
import qq from '../qq/qq.js'
import ntqq from '../ntqq/ntqq.js'
/**
 * *************
 * defset-config
 * *************
 */
const config: ConfigType = {
  redis,
  mysql,
  discord,
  kook,
  villa,
  qq,
  ntqq,
  server,
  puppeteer
}
/**
 * init config
 * @param val
 */
export function setBotConfig(val: ConfigType) {
  // 分布覆盖
  for (const i in val) {
    // 当且仅当存在同key的时候才会覆盖默认配置
    if (Object.prototype.hasOwnProperty.call(config, i)) {
      if (i == 'puppeteer') {
        // pup 不用检查 直接覆盖
        for (const j in val[i]) {
          config[i][j] = val[i][j]
        }
      } else {
        for (const j in val[i]) {
          // 当前仅当同属性名的时候才会覆盖默认配置
          if (Object.prototype.hasOwnProperty.call(config[i], j)) {
            config[i][j] = val[i][j]
          } else {
            console.info('[alemonjs][存在无效参数]', val[i])
          }
        }
      }
    } else {
      console.info('[alemonjs][存在无效参数]', val[i])
    }
  }
}

/**
 * set
 * @param key
 * @param val
 */
export function setBotConfigByKey<T extends keyof ConfigType>(
  key: T,
  val: ConfigType[T]
): void {
  if (key == 'puppeteer') {
    // pup 不用检查 直接覆盖
    for (const item in val) {
      config[key][item] = val[item]
    }
  } else {
    for (const item in val) {
      // 当前仅当同属性名的时候才会覆盖默认配置
      if (Object.prototype.hasOwnProperty.call(config[key], item)) {
        config[key][item] = val[item]
      } else {
        console.info('[alemonjs][存在无效参数]', val[item])
      }
    }
  }
}

/**
 * get
 * @param key
 * @returns
 */
export function getBotConfigByKey<T extends keyof ConfigType>(
  key: T
): ConfigType[T] | undefined {
  return config[key]
}
