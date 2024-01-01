import { type ConfigType } from './types.js'
import redis from '../default/redis.js'
import mysql from '../default/mysql.js'
import server from '../default/server.js'
import { defineKOOK as kook } from '../kook/kook.js'
import { defineVILLA as villa } from '../villa/villa.js'
import { defineQQ as qq } from '../qq/qq.js'
import { defineNtqq as ntqq } from '../ntqq/ntqq.js'
import { defineDISCORD as discord } from '../discord/discord.js'
import { Screenshot } from '../core/index.js'
class BotConfig {
  data = {
    redis,
    mysql,
    kook,
    villa,
    qq,
    ntqq,
    server,
    puppeteer: Screenshot.launch,
    discord
  } as ConfigType
  set<T extends keyof ConfigType>(key: T, val: ConfigType[T]): void {
    if (key == 'puppeteer') {
      // pup 不用检查 直接覆盖
      for (const item in val) {
        this.data[key][item] = val[item]
      }
    } else {
      for (const item in val) {
        // 当前仅当同属性名的时候才会覆盖默认配置
        if (Object.prototype.hasOwnProperty.call(this.data[key], item)) {
          this.data[key][item] = val[item]
        } else {
          // 不属于默认
          try {
            this.data[key] = {} as any
            this.data[key] = val[item] as any
            console.info('KEY secess')
          } catch {
            console.info('KEY err')
          }
        }
      }
    }
  }
  get<T extends keyof ConfigType>(key: T): ConfigType[T] | undefined {
    return this.data[key]
  }
}
export const BOTCONFIG = new BotConfig()
