import { watch } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { readFileSync, existsSync } from 'fs'

/**
 * @param key 参数
 * @returns 参数值
 */
export const getArgvValue = (key: string) => {
  const v = process.argv.indexOf(key)
  if (v === -1) return null
  const next = process.argv[v + 1]
  if (typeof next == 'string') {
    // 如果是参数
    if (next.startsWith('-')) return null
    // 如果是值
    return next
  }
  return null
}

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

  #setLogin = () => {
    const login = getArgvValue('--login')
    if (!this.#value) {
      this.#value = {}
    }
    if (login) {
      this.#value.login = login
    }
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
      this.#setLogin()
      return this.#value
    }
    const data = readFileSync(dir, 'utf-8')
    try {
      const d = parse(data)
      this.#value = d
      this.#setLogin()
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
        // 尝试读取执行参数
        this.#setLogin()
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
