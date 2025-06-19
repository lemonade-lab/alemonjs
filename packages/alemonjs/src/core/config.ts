import '../typings'
import { readFileSync, existsSync, watch, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import YAML from 'yaml'
import { Package } from '../typing/package'
import { ResultCode } from './code'
import * as JSON from 'flatted'

/**
 * 配置类
 */
export class ConfigCore {
  //
  #dir: string | null = null

  #value: any = null

  #initValue = {
    gui: {
      port: 17127
    }
  }

  /**
   *
   * @param dir
   */
  constructor(dir: string) {
    this.#dir = dir
  }

  /**
   *
   * @returns
   */
  #update() {
    if (!this.#dir) return this.#value
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir)
    // 如果文件不存在
    if (!existsSync(dir)) {
      this.saveValue(this.#initValue)
      return this.#value
    }
    try {
      const data = readFileSync(dir, 'utf-8')
      const d = YAML.parse(data)
      this.#value = d
    } catch (err) {
      logger.error({
        code: ResultCode.FailInternal,
        message: 'Config file parse error',
        data: err
      })
      process.cwd()
    }
    // 存在配置文件 , 开始监听文件
    watch(dir, () => {
      try {
        const data = readFileSync(dir, 'utf-8')
        const d = YAML.parse(data)
        this.#value = d
      } catch (err) {
        logger.error({
          code: ResultCode.FailInternal,
          message: 'Config file parse error',
          data: err
        })
        process.cwd()
      }
    })
    return this.#value
  }

  /**
   * 当且仅当配置文件存在时
   */
  get value(): null | {
    [key: string]: any
  } {
    if (!this.#value) {
      return this.#update()
    }
    return this.#value
  }

  /**
   * 保存value
   */
  saveValue(value: { [key: string]: any }) {
    // 立即保存当前配置
    if (!this.#dir) return
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir)
    if (!existsSync(dir)) {
      mkdirSync(dirname(dir), { recursive: true })
    }
    const data = YAML.stringify(value)
    writeFileSync(dir, data, 'utf-8')
  }

  #package = null

  /**
   * package.json
   */
  get package(): null | Package {
    if (this.#package) return this.#package
    const dir = process.env.PKG_PATH || join(process.cwd(), 'package.json')
    if (!existsSync(dir)) {
      logger.warn({
        code: ResultCode.FailInternal,
        message: 'package.json not found',
        data: null
      })
      return null
    }
    const data = readFileSync(dir, 'utf-8')
    try {
      this.#package = JSON.parse(data)
    } catch (err) {
      logger.error({
        code: ResultCode.FailInternal,
        message: 'package.json parse error',
        data: err
      })
      return null
    }
    return this.#package
  }

  /**
   * 命令行参数，
   * ****
   * 获取 --name value
   * ****
   * 例：argv.login == 'gui'
   */
  get argv() {
    const argv: {
      [key: string]: string | null | undefined
    } = {}
    return new Proxy(argv, {
      get(_target, key) {
        if (typeof key === 'symbol') return undefined
        const index$0 = process.argv.indexOf(key)
        if (index$0 != -1) {
          return process.argv[index$0 + 1]
        }
        const index = process.argv.indexOf(`--${key}`)
        if (index != -1) {
          return process.argv[index + 1]
        }
        return null
      }
    })
  }
}

/**
 *
 * @returns
 */
export const getConfig = (): typeof ConfigCore.prototype => {
  if (global?.config) return global.config
  global.config = new ConfigCore('alemon.config.yaml')
  return global.config
}

/**
 * @returns
 */
export const getConfigValue = () => getConfig()?.value
