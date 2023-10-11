import { ConfigType } from './types.js'
/**
 * bot-config
 */
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
    intents: [],
    port: 9090,
    size: 999999,
    img_url: '/api/mys/img',
    IMAGE_DIR: '/data/mys/img',
    http: 'http'
  },
  server: {
    host: '127.0.0.1',
    port: 5000
  },
  /**
   * pup的配置的繁多的
   */
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
  for (const i in val) {
    // 当且仅当存在同key的时候才会覆盖默认配置
    if (Object.prototype.hasOwnProperty.call(config, i)) {
      for (const j in val[i]) {
        // 当前仅当同属性名的时候才会覆盖默认配置
        if (Object.prototype.hasOwnProperty.call(config[i], j)) {
          config[i][j] = val[i][j]
        } else {
          console.log('[alemonjs][存在无效参数]', val[i])
        }
      }
    } else {
      console.log('[alemonjs][存在无效参数]', val[i])
    }
  }
}

/**
 * 设置
 * @param key
 * @param val
 */
export function setBotConfigByKey<T extends keyof ConfigType>(
  key: T,
  val: ConfigType[T]
): void {
  // 分布覆盖
  for (const item in val) {
    // 当前仅当同属性名的时候才会覆盖默认配置
    if (Object.prototype.hasOwnProperty.call(config[key], item)) {
      config[key][item] = val[item]
    } else {
      console.log('[alemonjs][存在无效参数]', val[item])
    }
  }
}

/**
 * 得到配置
 * @param key
 * @returns
 */
export function getBotConfigByKey<T extends keyof ConfigType>(
  key: T
): ConfigType[T] | undefined {
  return config[key]
}
