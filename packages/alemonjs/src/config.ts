import './global'
import { readFileSync, existsSync, watch } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'

/**
 * 配置类
 */
class ConfigCore {
  //
  #dir = null

  #value = null

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
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir)
    logger.info('config read', dir)
    // 如果文件不存在
    if (!existsSync(dir)) {
      // 尝试读取执行参数
      return this.#value
    }
    const data = readFileSync(dir, 'utf-8')
    try {
      const d = parse(data)
      this.#value = d
    } catch (err) {
      logger.error(err)
      process.cwd()
    }
    // 存在配置文件 , 开始监听文件
    watch(dir, () => {
      logger.info('config update', dir)
      const data = readFileSync(dir, 'utf-8')
      try {
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
  get value() {
    if (!this.#value) {
      return this.#update()
    }
    return this.#value
  }

  #package = null

  /**
   * package.json
   */
  get package() {
    if (this.#package) return this.#package
    const dir = process.env.PKG_DIR || join(process.cwd(), 'package.json')
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
   * 命令行参数
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
