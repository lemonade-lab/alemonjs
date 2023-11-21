import { getAuthentication } from './api/auth.js'

interface BotCaCheType {
  appID: string
  token: string
  secret: string
  intents: number
  isPrivate?: boolean
  sandbox?: boolean
}

/**
 * 机器人缓存配置
 */
let cfg: BotCaCheType = {
  appID: '',
  token: '',
  secret: '',
  intents: 0,
  isPrivate: false,
  sandbox: false
}
/**
 * 得到机器人配置
 * @returns
 */
export function getBotConfig() {
  return cfg
}
/**
 * 设置机器人配置
 * @param val
 * @returns
 */
export function setBotNTQQConfig(val: {
  appID: string
  token: string
  secret: string
  intents: number
}) {
  cfg = val
  return
}

interface aut {
  access_token: string
  expires_in: number
  cache: boolean
}

/**
 * 定时鉴权
 */
export async function setTimeoutBotConfig(cfg: BotCaCheType) {
  /**
   * 发送请求
   */
  const data: aut = await getAuthentication(cfg.appID, cfg.secret).then(
    res => res.data
  )

  const g: BotCaCheType = {
    appID: cfg.appID,
    token: data.access_token,
    secret: cfg.secret,
    intents: cfg.intents,
    isPrivate: cfg.isPrivate,
    sandbox: cfg.sandbox
  }

  /**
   * 设置配置
   */
  setBotNTQQConfig(g)

  const bal = async () => {
    /**
     * 发送请求
     */
    const data: aut = await getAuthentication(cfg.appID, cfg.secret).then(
      res => res.data
    )

    g.token = data.access_token

    /**
     * 设置配置
     */
    setBotNTQQConfig(g)

    console.info('refresh', data.expires_in, 's')

    setTimeout(bal, data.expires_in * 1000)
  }

  setTimeout(bal, data.expires_in * 1000)
}
