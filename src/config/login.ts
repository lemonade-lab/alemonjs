import { type BotConfigType } from './types.js'
import { DefaultFileOptions } from '../file/default.js'
import { DefaultEmailOptions } from '../email/default.js'
import { defineKOOK as kook } from '../platform/kook/sdk/wss.types.js'
import { defineQQ as qq } from '../platform/qq/sdk/wss.types.js'
import { defineNtqq as ntqq } from '../platform/ntqq/sdk/wss.types.js'
import { defineDISCORD as discord } from '../platform/discord/sdk/wss.types.js'
import { ALunchConfig } from '../core/index.js'
import { loger } from '../log.js'

class BaseConfig<D> {
  #data: D = null
  constructor(val: D) {
    this.#data = val
  }
  /**
   * 设置配置
   * @param key
   * @param val
   */
  set<T extends keyof D>(key: T, val: D[T]) {
    if (key == 'puppeteer') {
      // pup 不用检查 直接覆盖
      for (const item in val) {
        this.#data[key][item] = val[item]
      }
    } else {
      for (const item in val) {
        if (this.#data[key]) {
          // 当前仅当同属性名的时候才会覆盖默认配置
          if (Object.prototype.hasOwnProperty.call(this.#data[key], item)) {
            this.#data[key][item] = val[item]
          } else {
            // 不属于默认
            try {
              this.#data[key] = val[item] as any
              loger.info('KEY secess')
            } catch {
              loger.info('KEY err')
            }
          }
        } else {
          this.#data[key] = val[item] as any
        }
      }
    }
    return this
  }
  /**
   * 读取配置
   * @param key
   * @returns
   */
  get<T extends keyof D>(key: T): D[T] | undefined {
    return this.#data[key]
  }
}

/**
 * 机器人配置
 */
export const ABotConfig = new BaseConfig<BotConfigType>({
  file: DefaultFileOptions,
  email: DefaultEmailOptions,
  kook,
  qq,
  ntqq,
  puppeteer: ALunchConfig.all(),
  discord
})
