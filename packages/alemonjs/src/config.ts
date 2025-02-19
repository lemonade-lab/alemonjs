import './global'
import { readFileSync, existsSync, watch, writeFileSync } from 'fs'
import { join } from 'path'
import { parse, stringify } from 'yaml'

type Package = {
  [key: string]: any
  name: string | null
  version: string | null
  description: string | null
  author: string | null
  license: string | null
  type: string | null
  private: boolean | null
}

/**
 * 配置类
 */
export class ConfigCore {
  //
  #dir: string | null = null

  #value: any = null

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
    logger.info('config read', dir)
    // 如果文件不存在
    if (!existsSync(dir)) {
      // 尝试读取执行参数
      return this.#value
    }
    try {
      const data = readFileSync(dir, 'utf-8')
      const d = parse(data)
      this.#value = d
    } catch (err) {
      logger.error(err)
      process.cwd()
    }
    // 存在配置文件 , 开始监听文件
    watch(dir, () => {
      logger.info('config update', dir)
      try {
        const data = readFileSync(dir, 'utf-8')
        const d = parse(data)
        this.#value = d
      } catch (err) {
        logger.error(err)
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
    logger.info('config save', dir)
    // 如果文件不存在
    if (!existsSync(dir)) return
    const data = stringify(value)
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
      logger.warn('package.json not found')
      return null
    }
    const data = readFileSync(dir, 'utf-8')
    try {
      this.#package = JSON.parse(data)
    } catch (err) {
      logger.error(err)
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
      [key: string]: string | true | undefined
    } = {}
    process.argv.forEach((arg, index) => {
      if (arg.startsWith('--')) {
        const key = arg.slice(2)
        const value = process.argv[index + 1]
        if (value && !value.startsWith('--')) {
          argv[key] = value
        } else {
          argv[key] = true
        }
      }
    })
    return argv
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
 *
 * @returns
 */
export const getConfigValue = () => getConfig()?.value
