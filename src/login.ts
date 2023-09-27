import { ConfigType } from './types.js'
const config: ConfigType = {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 1
  },
  mysql: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alemon'
  },
  discord: {
    token: '',
    masterID: '',
    password: '',
    intents: []
  },
  kook: {
    token: '',
    masterID: '',
    password: ''
  },
  villa: {
    bot_id: '',
    secret: '',
    pub_key: '',
    masterID: '',
    password: '',
    http: 'http',
    url: '/api/mys/callback',
    port: 8080,
    size: 999999,
    img_url: '/api/mys/img',
    IMAGE_DIR: '/data/mys/img'
  },
  qq: {
    appID: '',
    token: '',
    masterID: '',
    password: '',
    intents: [],
    isPrivate: false,
    sandbox: false
  },
  ntqq: {
    appID: '',
    token: '',
    secret: '',
    masterID: '',
    password: '',
    intents: []
  },
  server: {
    host: '127.0.0.1',
    port: 5000
  },
  puppeteer: {
    headless: 'new',
    timeout: 30000,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-sandbox',
      '--no-zygote',
      '--single-process'
    ]
  }
}

/**
 * 初始化配置
 * @param val
 */
export function setBotConfig(val: ConfigType) {
  // 分布覆盖
  for (const item in val) {
    // 当且仅当存在同key的时候才会覆盖默认配置
    for (const i in val[item]) {
      // 当前仅当同属性名的时候才会覆盖默认配置
      config[item][i] = val[item][i]
    }
  }
}

/**
 * 设置
 * @param key
 * @param val
 */
export function setBotConfigByKey<T extends keyof ConfigType>(key: T, val: ConfigType[T]): void {
  // 分布覆盖
  for (const item in val) {
    // 当前仅当同属性名的时候才会覆盖默认配置
    config[key][item] = val[item]
  }
}

/**
 * 得到配置
 * @param key
 * @returns
 */
export function getBotConfigByKey<T extends keyof ConfigType>(key: T): ConfigType[T] | undefined {
  return config[key]
}
