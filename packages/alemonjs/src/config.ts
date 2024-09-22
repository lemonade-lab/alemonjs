import { watch } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { readFileSync, existsSync } from 'fs'
import { BotConfigType } from './typing/types'

// 尝试从参数中，得到更高优先级的配置
export const argv = [...process.argv].slice(2)

/**
 * @param key 参数
 * @returns 参数值
 */
export const getArgvValue = (key: string) => {
  const v = argv.indexOf(key)
  if (v === -1) return null
  const next = argv[v + 1]
  if (typeof next == 'string') {
    // 如果是参数
    if (next.startsWith('-')) return null
    // 如果是值
    return next
  }
  return null
}

export type ConfigType = {
  login: string | undefined
  app_id: string | undefined
  token: string | undefined
  intent: string | undefined
  secret: string | undefined
  shard: number[] | undefined
  intents: string[] | undefined
  master_id: string[] | undefined
}

/**
 * 配置类
 */
export class Config {
  //
  #dir = null

  //
  #values: ConfigType = null

  #value = null

  /**
   *
   * @param dir
   */
  constructor(dir: string) {
    this.#dir = dir
  }

  /**
   * 初始化参数
   */
  #initArgs() {
    const app_id = getArgvValue('--app_id')
    if (typeof app_id == 'string') {
      this.#values.app_id = app_id
    }
    const token = getArgvValue('--token')
    if (typeof token == 'string') {
      this.#values.token = token
    }
    const intent = getArgvValue('--intent')
    if (typeof intent == 'string') {
      this.#values.intent = intent
    }
    const secret = getArgvValue('--secret')
    if (typeof secret == 'string') {
      this.#values.secret = secret
    }
    const shard = getArgvValue('--shard')
    if (typeof shard == 'string') {
      this.#values.shard = JSON.parse(shard)
    }
    const intents = getArgvValue('--intents')
    if (typeof intents == 'string') {
      this.#values.intents = JSON.parse(intents)
    }
    const master_id = getArgvValue('--master_id')
    if (typeof master_id == 'string') {
      this.#values.master_id = JSON.parse(master_id)
    }
  }

  /**
   *
   * @param data
   */
  #initData = (data: BotConfigType) => {
    // 尝试读取执行参数
    let login = getArgvValue('--login')
    if (!login) {
      if (data.login) {
        login = data.login
      }
    } else {
      this.#values.login = login
    }
    try {
      const d = data[login]
      if (!d) {
        return this.#values
      }
      if (d?.app_id) {
        this.#values.app_id = d.app_id
      }
      if (d?.token) {
        this.#values.token = d.token
      }
      if (d?.intent) {
        this.#values.intent = d.intent
      }
      if (d?.secret) {
        this.#values.secret = d.secret
      }
      if (d?.shard) {
        this.#values.shard = d.shard
      }
      if (d?.intents) {
        this.#values.intents = d.intents
      }
      if (d?.master_id) {
        this.#values.master_id = d.master_id
      }
    } catch {
      //
    }
    return this.#values
  }

  /**
   *
   * @returns
   */
  #update() {
    // 读取配置文件
    const dir = join(process.cwd(), this.#dir)
    console.info(dir)
    // 如果文件不存在
    if (!existsSync(dir)) {
      console.warn('alemon.config.yaml not found')
      // 尝试读取执行参数
      const login = getArgvValue('--login')
      if (login) {
        this.#values.login = login
      }
      // 根据参数设置成配置
      this.#initArgs()
      return this.#values
    }
    const data = readFileSync(dir, 'utf-8')
    try {
      const d = parse(data)
      this.#value = d
      this.#initData(d)
      this.#initArgs()
    } catch (err) {
      console.error(err)
      process.cwd()
    }
    // 存在配置文件 , 开始监听文件
    watch(dir, () => {
      const data = readFileSync(dir, 'utf-8')
      try {
        const d = parse(data)
        this.#value = d
        this.#initData(d)
        // 确保参数优先级最高
        this.#initArgs()
      } catch (err) {
        console.error(err)
      }
    })
    return this.#values
  }

  /**
   * 归一配置值
   */
  get values() {
    if (!this.#values) {
      this.#values = {
        login: undefined,
        app_id: undefined,
        token: undefined,
        intent: undefined,
        secret: undefined,
        shard: undefined,
        intents: undefined,
        master_id: undefined
      }
      return this.#update()
    }
    return this.#values
  }

  /**
   * 当且仅当配置文件存在时
   */
  get value() {
    return this.#value
  }
}
