import { ConfigType } from './types.js'
import redis from '../default/redis.js'
import mysql from '../default/mysql.js'
import server from '../default/server.js'
import puppeteer from '../default/pup.js'
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
  kook,
  villa,
  qq,
  ntqq,
  server,
  puppeteer
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
        try {
          config[key] = {}
          config[key] = val[item]
          console.info('[alemonjs][新增KEY成功]')
        } catch {
          console.info('[alemonjs][新增KEY失败]')
        }
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
