import axios, { type AxiosRequestConfig } from 'axios'
import { getBotConfig } from './config.js'
import { ApiLog } from './log.js'

/**
 * KOOK服务
 * @param config
 * @returns
 */
export function Service(config: AxiosRequestConfig) {
  const token = getBotConfig('token')
  const service = axios.create({
    baseURL: 'https://discord.com/api/v10',
    timeout: 6000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${token}`
    }
  })
  return service(config)
}

/**
 * 鉴权
 * @returns
 */
export function gateway(): Promise<{
  url: string
}> {
  return Service({
    method: 'get',
    url: '/gateway'
  }).then(ApiLog)
}
