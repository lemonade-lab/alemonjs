import { ConfigType } from './types.js'
import redis from '../default/redis.js'
import mysql from '../default/mysql.js'
import server from '../default/server.js'
import puppeteer from '../default/pup.js'
import { defineKOOK as kook } from '../kook/kook.js'
import { defineVILLA as villa } from '../villa/villa.js'
import { defineQQ as qq } from '../qq/qq.js'
import { defineNtqq as ntqq } from '../ntqq/ntqq.js'
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
 * 设置机器人基础配置
 * @param key 配置名
 * @param val 配置值
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
          console.info('[新增KEY成功]')
        } catch {
          console.info('[新增KEY失败]')
        }
      }
    }
  }
}

/**
 * g得到机器人基础配置
 * @param key 配置名
 * @returns 得到配置值
 */
export function getBotConfigByKey<T extends keyof ConfigType>(
  key: T
): ConfigType[T] | undefined {
  return config[key]
}
